use axum::{
    extract::{Path, Query, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{error::AppError, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/issues",
            get(list_issues).post(create_issue),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/issues/{number}",
            get(get_issue),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests",
            get(list_change_requests),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/branches",
            get(list_branches),
        )
        .route("/api/v1/orgs/{org}/repos/{repo}/locks", get(list_locks))
        .route("/api/v1/orgs/{org}/repos/{repo}/labels", get(list_labels))
}

// --- shared helpers --------------------------------------------------------

async fn resolve_repo_id(state: &AppState, org: &str, repo: &str) -> Result<Uuid, AppError> {
    let row: Option<(Uuid,)> = sqlx::query_as(
        r#"
        SELECT r.id
        FROM repositories r
        JOIN organizations o ON o.id = r.org_id
        WHERE o.name = $1 AND r.name = $2
        "#,
    )
    .bind(org)
    .bind(repo)
    .fetch_optional(&state.pool)
    .await?;

    row.map(|(id,)| id)
        .ok_or_else(|| AppError::not_found("repository not found"))
}

#[derive(Debug, Deserialize)]
pub struct StateQuery {
    pub state: Option<String>,
}

// --- issues ----------------------------------------------------------------

#[derive(Debug, Serialize, FromRow)]
pub struct IssueListItem {
    pub number: i32,
    pub title: String,
    pub state: String,
    pub author_username: Option<String>,
    pub labels: Vec<String>,
    pub assignees: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

async fn list_issues(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
    Query(query): Query<StateQuery>,
) -> Result<Json<Vec<IssueListItem>>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let state_filter = query.state.unwrap_or_else(|| "all".to_owned());

    let issues = sqlx::query_as::<_, IssueListItem>(
        r#"
        SELECT
            i.number,
            i.title,
            i.state,
            u.username AS author_username,
            COALESCE(array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '{}') AS labels,
            COALESCE(array_agg(DISTINCT au.username) FILTER (WHERE au.username IS NOT NULL), '{}') AS assignees,
            i.created_at
        FROM issues i
        LEFT JOIN users u ON u.id = i.author_id
        LEFT JOIN issue_labels il ON il.issue_id = i.id
        LEFT JOIN labels l ON l.id = il.label_id
        LEFT JOIN issue_assignees ia ON ia.issue_id = i.id
        LEFT JOIN users au ON au.id = ia.user_id
        WHERE i.repo_id = $1 AND ($2 = 'all' OR i.state = $2)
        GROUP BY i.id, u.username
        ORDER BY i.number DESC
        "#,
    )
    .bind(repo_id)
    .bind(state_filter)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(issues))
}

#[derive(Debug, Serialize, FromRow)]
pub struct IssueComment {
    pub author_username: Option<String>,
    pub body: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct IssueDetail {
    #[serde(flatten)]
    pub issue: IssueListItem,
    pub body: String,
    pub comments: Vec<IssueComment>,
}

async fn get_issue(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
) -> Result<Json<IssueDetail>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;

    let issue = sqlx::query_as::<_, IssueListItem>(
        r#"
        SELECT
            i.number,
            i.title,
            i.state,
            u.username AS author_username,
            COALESCE(array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '{}') AS labels,
            COALESCE(array_agg(DISTINCT au.username) FILTER (WHERE au.username IS NOT NULL), '{}') AS assignees,
            i.created_at
        FROM issues i
        LEFT JOIN users u ON u.id = i.author_id
        LEFT JOIN issue_labels il ON il.issue_id = i.id
        LEFT JOIN labels l ON l.id = il.label_id
        LEFT JOIN issue_assignees ia ON ia.issue_id = i.id
        LEFT JOIN users au ON au.id = ia.user_id
        WHERE i.repo_id = $1 AND i.number = $2
        GROUP BY i.id, u.username
        "#,
    )
    .bind(repo_id)
    .bind(number)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("issue not found"))?;

    let body: (String,) = sqlx::query_as(
        "SELECT body FROM issues WHERE repo_id = $1 AND number = $2",
    )
    .bind(repo_id)
    .bind(number)
    .fetch_one(&state.pool)
    .await?;

    let comments = sqlx::query_as::<_, IssueComment>(
        r#"
        SELECT u.username AS author_username, c.body, c.created_at
        FROM issue_comments c
        JOIN issues i ON i.id = c.issue_id
        LEFT JOIN users u ON u.id = c.author_id
        WHERE i.repo_id = $1 AND i.number = $2
        ORDER BY c.created_at ASC
        "#,
    )
    .bind(repo_id)
    .bind(number)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(IssueDetail {
        body: body.0,
        comments,
        issue,
    }))
}

#[derive(Debug, Deserialize)]
pub struct CreateIssueRequest {
    pub title: String,
    pub body: Option<String>,
    pub author_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CreatedIssue {
    pub number: i32,
}

async fn create_issue(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
    Json(request): Json<CreateIssueRequest>,
) -> Result<Json<CreatedIssue>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let title = request.title.trim().to_owned();
    if title.is_empty() {
        return Err(AppError::bad_request("issue title is required"));
    }

    // Allocate the next per-repository issue number atomically.
    let next_number: (i32,) = sqlx::query_as(
        "SELECT COALESCE(MAX(number), 0) + 1 FROM issues WHERE repo_id = $1",
    )
    .bind(repo_id)
    .fetch_one(&state.pool)
    .await?;

    let created = sqlx::query_as::<_, (i32,)>(
        r#"
        INSERT INTO issues (repo_id, number, title, body, author_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING number
        "#,
    )
    .bind(repo_id)
    .bind(next_number.0)
    .bind(title)
    .bind(request.body.unwrap_or_default())
    .bind(request.author_id)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(CreatedIssue { number: created.0 }))
}

// --- change requests -------------------------------------------------------

#[derive(Debug, Serialize, FromRow)]
pub struct ChangeRequestListItem {
    pub number: i32,
    pub title: String,
    pub state: String,
    pub author_username: Option<String>,
    pub source_branch: String,
    pub target_branch: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

async fn list_change_requests(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
    Query(query): Query<StateQuery>,
) -> Result<Json<Vec<ChangeRequestListItem>>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let state_filter = query.state.unwrap_or_else(|| "all".to_owned());

    let crs = sqlx::query_as::<_, ChangeRequestListItem>(
        r#"
        SELECT cr.number, cr.title, cr.state, u.username AS author_username,
               cr.source_branch, cr.target_branch, cr.created_at
        FROM change_requests cr
        LEFT JOIN users u ON u.id = cr.author_id
        WHERE cr.repo_id = $1 AND ($2 = 'all' OR cr.state = $2)
        ORDER BY cr.number DESC
        "#,
    )
    .bind(repo_id)
    .bind(state_filter)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(crs))
}

// --- branches / locks / labels ---------------------------------------------

#[derive(Debug, Serialize, FromRow)]
pub struct BranchItem {
    pub name: String,
    pub head_revision: String,
    pub is_default: bool,
    pub updated_at: chrono::DateTime<chrono::Utc>,
}

async fn list_branches(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
) -> Result<Json<Vec<BranchItem>>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let branches = sqlx::query_as::<_, BranchItem>(
        r#"
        SELECT name, head_revision, is_default, updated_at
        FROM branches
        WHERE repo_id = $1
        ORDER BY is_default DESC, name ASC
        "#,
    )
    .bind(repo_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(branches))
}

#[derive(Debug, Serialize, FromRow)]
pub struct LockItem {
    pub path: String,
    pub owner_username: Option<String>,
    pub lock_type: String,
    pub note: Option<String>,
    pub acquired_at: chrono::DateTime<chrono::Utc>,
}

async fn list_locks(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
) -> Result<Json<Vec<LockItem>>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let locks = sqlx::query_as::<_, LockItem>(
        r#"
        SELECT l.path, u.username AS owner_username, l.lock_type, l.note, l.acquired_at
        FROM locks l
        LEFT JOIN users u ON u.id = l.owner_id
        WHERE l.repo_id = $1
        ORDER BY l.acquired_at DESC
        "#,
    )
    .bind(repo_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(locks))
}

async fn list_labels(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
) -> Result<Json<Vec<db_types::Label>>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let labels = sqlx::query_as::<_, db_types::Label>(
        r#"
        SELECT id, repo_id, name, color, description
        FROM labels
        WHERE repo_id = $1
        ORDER BY name ASC
        "#,
    )
    .bind(repo_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(labels))
}
