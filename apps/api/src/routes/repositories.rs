use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use db_types::{Permission, Repository};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{error::AppError, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/v1/repositories",
            get(list_repositories).post(create_repository),
        )
        .route("/api/v1/repositories/{id}", get(get_repository))
        .route(
            "/api/v1/repositories/{id}/lore-token",
            post(issue_lore_token),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}",
            get(get_repo_settings).patch(update_repo_settings),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/collaborators",
            get(list_collaborators),
        )
}

#[derive(Debug, Deserialize)]
pub struct CreateRepositoryRequest {
    pub org_id: Option<Uuid>,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub visibility: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct IssueLoreTokenRequest {
    pub permission: Permission,
    pub subject: Option<String>,
    pub ttl_seconds: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct RepositoryResponse {
    pub id: Uuid,
    pub org_id: Option<Uuid>,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub visibility: String,
    pub lore_partition_id: String,
    pub default_branch: String,
    pub archived: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct LoreTokenResponse {
    pub token: String,
    pub permission: Permission,
    pub partition_id: String,
    pub lore_server_url: String,
    pub expires_in_seconds: u64,
}

impl From<Repository> for RepositoryResponse {
    fn from(repository: Repository) -> Self {
        Self {
            id: repository.id,
            org_id: repository.org_id,
            name: repository.name,
            display_name: repository.display_name,
            description: repository.description,
            visibility: repository.visibility,
            lore_partition_id: hex::encode(repository.lore_partition_id),
            default_branch: repository.default_branch,
            archived: repository.archived,
            created_at: repository.created_at,
        }
    }
}

async fn list_repositories(
    State(state): State<AppState>,
) -> Result<Json<Vec<RepositoryResponse>>, AppError> {
    let repositories = sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, org_id, name, display_name, description, visibility, lore_partition_id,
               default_branch, archived, created_at
        FROM repositories
        ORDER BY created_at DESC
        "#,
    )
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(
        repositories
            .into_iter()
            .map(RepositoryResponse::from)
            .collect(),
    ))
}

async fn get_repository(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<RepositoryResponse>, AppError> {
    let repository = fetch_repository(&state, id).await?;
    Ok(Json(repository.into()))
}

async fn create_repository(
    State(state): State<AppState>,
    Json(request): Json<CreateRepositoryRequest>,
) -> Result<Json<RepositoryResponse>, AppError> {
    let name = request.name.trim().to_lowercase();
    let display_name = request.display_name.trim().to_owned();
    let visibility = request
        .visibility
        .as_deref()
        .unwrap_or("private")
        .to_lowercase();

    if name.is_empty() || display_name.is_empty() {
        return Err(AppError::bad_request(
            "repository name and display name are required",
        ));
    }

    if !matches!(visibility.as_str(), "public" | "internal" | "private") {
        return Err(AppError::bad_request(
            "visibility must be one of: public, internal, private",
        ));
    }

    let provisioned_partition = state.lore_client.provision_partition(&name).await;
    let repository = sqlx::query_as::<_, Repository>(
        r#"
        INSERT INTO repositories (
            org_id,
            name,
            display_name,
            description,
            visibility,
            lore_partition_id
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, org_id, name, display_name, description, visibility, lore_partition_id,
                  default_branch, archived, created_at
        "#,
    )
    .bind(request.org_id)
    .bind(name)
    .bind(display_name)
    .bind(
        request
            .description
            .map(|description| description.trim().to_owned()),
    )
    .bind(visibility)
    .bind(provisioned_partition.partition_id.to_vec())
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(repository.into()))
}

async fn issue_lore_token(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(request): Json<IssueLoreTokenRequest>,
) -> Result<Json<LoreTokenResponse>, AppError> {
    let repository = fetch_repository(&state, id).await?;
    let ttl_seconds = request.ttl_seconds.unwrap_or(15 * 60).clamp(60, 15 * 60);
    let token = state.token_issuer.issue_repository_token(
        &repository,
        request.permission,
        ttl_seconds,
        request
            .subject
            .unwrap_or_else(|| format!("repo:{}", repository.id)),
    )?;

    Ok(Json(LoreTokenResponse {
        token,
        permission: request.permission,
        partition_id: hex::encode(&repository.lore_partition_id),
        lore_server_url: state.lore_server_url.clone(),
        expires_in_seconds: ttl_seconds,
    }))
}

async fn fetch_repository(state: &AppState, id: Uuid) -> Result<Repository, AppError> {
    sqlx::query_as::<_, Repository>(
        r#"
        SELECT id, org_id, name, display_name, description, visibility, lore_partition_id,
               default_branch, archived, created_at
        FROM repositories
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_one(&state.pool)
    .await
    .map_err(AppError::from)
}

#[derive(Debug, Serialize, FromRow)]
pub struct RepoSettings {
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub visibility: String,
    pub default_branch: String,
    pub required_approvals: i32,
    pub archived: bool,
}

async fn get_repo_settings(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
) -> Result<Json<RepoSettings>, AppError> {
    let settings = sqlx::query_as::<_, RepoSettings>(
        r#"
        SELECT r.name, r.display_name, r.description, r.visibility,
               r.default_branch, r.required_approvals, r.archived
        FROM repositories r
        JOIN organizations o ON o.id = r.org_id
        WHERE o.name = $1 AND r.name = $2
        "#,
    )
    .bind(&org)
    .bind(&repo)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("repository not found"))?;

    Ok(Json(settings))
}

#[derive(Debug, Deserialize)]
pub struct UpdateRepoSettingsRequest {
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub visibility: Option<String>,
    pub default_branch: Option<String>,
    pub required_approvals: Option<i32>,
    pub archived: Option<bool>,
}

async fn update_repo_settings(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
    Json(request): Json<UpdateRepoSettingsRequest>,
) -> Result<Json<RepoSettings>, AppError> {
    let visibility = match request.visibility.as_deref() {
        Some(v) => {
            let v = v.to_lowercase();
            if !matches!(v.as_str(), "public" | "internal" | "private") {
                return Err(AppError::bad_request(
                    "visibility must be one of: public, internal, private",
                ));
            }
            Some(v)
        }
        None => None,
    };
    if let Some(n) = request.required_approvals {
        if n < 0 {
            return Err(AppError::bad_request(
                "required_approvals must be zero or greater",
            ));
        }
    }

    let settings = sqlx::query_as::<_, RepoSettings>(
        r#"
        UPDATE repositories r
        SET display_name = COALESCE($3, r.display_name),
            description = COALESCE($4, r.description),
            visibility = COALESCE($5, r.visibility),
            default_branch = COALESCE($6, r.default_branch),
            required_approvals = COALESCE($7, r.required_approvals),
            archived = COALESCE($8, r.archived)
        FROM organizations o
        WHERE r.org_id = o.id AND o.name = $1 AND r.name = $2
        RETURNING r.name, r.display_name, r.description, r.visibility,
                  r.default_branch, r.required_approvals, r.archived
        "#,
    )
    .bind(&org)
    .bind(&repo)
    .bind(request.display_name.map(|s| s.trim().to_owned()))
    .bind(request.description.map(|s| s.trim().to_owned()))
    .bind(visibility)
    .bind(request.default_branch.map(|s| s.trim().to_owned()))
    .bind(request.required_approvals)
    .bind(request.archived)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("repository not found"))?;

    Ok(Json(settings))
}

#[derive(Debug, Serialize, FromRow)]
pub struct RepoCollaborator {
    pub username: String,
    pub display_name: String,
    pub org_role: String,
    pub repo_role: String,
    pub teams: Vec<String>,
}

async fn list_collaborators(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
) -> Result<Json<Vec<RepoCollaborator>>, AppError> {
    let collaborators = sqlx::query_as::<_, RepoCollaborator>(
        r#"
        SELECT u.username,
               u.display_name,
               COALESCE(om.role, 'External') AS org_role,
               rc.role AS repo_role,
               COALESCE(
                   array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL),
                   '{}'
               ) AS teams
        FROM repo_collaborators rc
        JOIN repositories r ON r.id = rc.repo_id
        JOIN organizations o ON o.id = r.org_id
        JOIN users u ON u.id = rc.user_id
        LEFT JOIN org_members om ON om.user_id = u.id AND om.org_id = r.org_id
        LEFT JOIN team_members tm ON tm.user_id = u.id
        LEFT JOIN teams t ON t.id = tm.team_id AND t.org_id = r.org_id
        WHERE o.name = $1 AND r.name = $2
        GROUP BY u.username, u.display_name, om.role, rc.role
        ORDER BY u.display_name ASC
        "#,
    )
    .bind(&org)
    .bind(&repo)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(collaborators))
}
