use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use db_types::{Permission, Repository};
use serde::{Deserialize, Serialize};
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
