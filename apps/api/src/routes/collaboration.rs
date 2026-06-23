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
            get(get_issue).patch(update_issue),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/issues/{number}/comments",
            axum::routing::post(create_issue_comment),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests",
            get(list_change_requests).post(create_change_request),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}",
            get(get_change_request),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/reviews",
            axum::routing::post(create_cr_review),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/comments",
            axum::routing::post(create_cr_comment),
        )
        .route(
            "/api/v1/orgs/{org}/repos/{repo}/change-requests/{number}/merge",
            axum::routing::post(merge_change_request),
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

#[derive(Debug, Deserialize)]
pub struct UpdateIssueRequest {
    pub state: String,
}

async fn update_issue(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
    Json(request): Json<UpdateIssueRequest>,
) -> Result<Json<CreatedIssue>, AppError> {
    if request.state != "open" && request.state != "closed" {
        return Err(AppError::bad_request("state must be 'open' or 'closed'"));
    }
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let updated = sqlx::query_as::<_, (i32,)>(
        "UPDATE issues SET state = $3 WHERE repo_id = $1 AND number = $2 RETURNING number",
    )
    .bind(repo_id)
    .bind(number)
    .bind(request.state)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("issue not found"))?;

    Ok(Json(CreatedIssue { number: updated.0 }))
}

#[derive(Debug, Deserialize)]
pub struct CreateCommentRequest {
    pub body: String,
    pub author_id: Option<Uuid>,
}

async fn create_issue_comment(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
    Json(request): Json<CreateCommentRequest>,
) -> Result<Json<CreatedIssue>, AppError> {
    let body = request.body.trim().to_owned();
    if body.is_empty() {
        return Err(AppError::bad_request("comment body is required"));
    }
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let issue_id: (Uuid,) =
        sqlx::query_as("SELECT id FROM issues WHERE repo_id = $1 AND number = $2")
            .bind(repo_id)
            .bind(number)
            .fetch_optional(&state.pool)
            .await?
            .ok_or_else(|| AppError::not_found("issue not found"))?;

    sqlx::query("INSERT INTO issue_comments (issue_id, author_id, body) VALUES ($1, $2, $3)")
        .bind(issue_id.0)
        .bind(request.author_id)
        .bind(body)
        .execute(&state.pool)
        .await?;

    Ok(Json(CreatedIssue { number }))
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
    pub labels: Vec<String>,
    pub approvals: i64,
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
               cr.source_branch, cr.target_branch,
               COALESCE(array_agg(DISTINCT l.name) FILTER (WHERE l.name IS NOT NULL), '{}') AS labels,
               COUNT(DISTINCT rev.id) FILTER (WHERE rev.state = 'approved') AS approvals,
               cr.created_at
        FROM change_requests cr
        LEFT JOIN users u ON u.id = cr.author_id
        LEFT JOIN cr_labels cl ON cl.cr_id = cr.id
        LEFT JOIN labels l ON l.id = cl.label_id
        LEFT JOIN cr_reviews rev ON rev.cr_id = cr.id
        WHERE cr.repo_id = $1 AND ($2 = 'all' OR cr.state = $2)
        GROUP BY cr.id, u.username
        ORDER BY cr.number DESC
        "#,
    )
    .bind(repo_id)
    .bind(state_filter)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(crs))
}

#[derive(Debug, Deserialize)]
pub struct CreateChangeRequestRequest {
    pub title: String,
    pub body: Option<String>,
    pub source_branch: String,
    pub target_branch: Option<String>,
    pub author_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CreatedChangeRequest {
    pub number: i32,
}

async fn create_change_request(
    State(state): State<AppState>,
    Path((org, repo)): Path<(String, String)>,
    Json(request): Json<CreateChangeRequestRequest>,
) -> Result<Json<CreatedChangeRequest>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let title = request.title.trim().to_owned();
    let source_branch = request.source_branch.trim().to_owned();
    if title.is_empty() {
        return Err(AppError::bad_request("change request title is required"));
    }
    if source_branch.is_empty() {
        return Err(AppError::bad_request("source branch is required"));
    }
    let target_branch = request
        .target_branch
        .map(|b| b.trim().to_owned())
        .filter(|b| !b.is_empty())
        .unwrap_or_else(|| "main".to_owned());

    let next_number: (i32,) = sqlx::query_as(
        "SELECT COALESCE(MAX(number), 0) + 1 FROM change_requests WHERE repo_id = $1",
    )
    .bind(repo_id)
    .fetch_one(&state.pool)
    .await?;

    let created = sqlx::query_as::<_, (i32,)>(
        r#"
        INSERT INTO change_requests
            (repo_id, number, title, body, author_id, source_branch, target_branch)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING number
        "#,
    )
    .bind(repo_id)
    .bind(next_number.0)
    .bind(title)
    .bind(request.body.unwrap_or_default())
    .bind(request.author_id)
    .bind(source_branch)
    .bind(target_branch)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(CreatedChangeRequest { number: created.0 }))
}

#[derive(Debug, Serialize, FromRow)]
pub struct CrReview {
    pub reviewer_username: Option<String>,
    pub state: String,
    pub body: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct CrComment {
    pub author_username: Option<String>,
    pub body: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct CrInlineComment {
    pub author_username: Option<String>,
    pub body: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct CrInlineThread {
    pub file_path: String,
    pub line: i32,
    pub resolved: bool,
    pub comments: Vec<CrInlineComment>,
}

// Raw inline-comment row before grouping into threads.
#[derive(Debug, FromRow)]
struct CrInlineRow {
    author_username: Option<String>,
    body: String,
    file_path: String,
    line: i32,
    resolved: bool,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Serialize)]
pub struct ChangeRequestDetail {
    pub number: i32,
    pub title: String,
    pub state: String,
    pub body: String,
    pub author_username: Option<String>,
    pub source_branch: String,
    pub target_branch: String,
    pub base_revision: Option<String>,
    pub head_revision: Option<String>,
    pub merge_revision: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub merged_at: Option<chrono::DateTime<chrono::Utc>>,
    pub labels: Vec<String>,
    pub reviewers: Vec<String>,
    pub linked_issues: Vec<i32>,
    pub reviews: Vec<CrReview>,
    pub comments: Vec<CrComment>,
    pub inline_threads: Vec<CrInlineThread>,
    pub approvals: i64,
    pub required_approvals: i32,
}

#[derive(Debug, FromRow)]
struct CrCore {
    id: Uuid,
    number: i32,
    title: String,
    state: String,
    body: String,
    author_username: Option<String>,
    source_branch: String,
    target_branch: String,
    base_revision: Option<String>,
    head_revision: Option<String>,
    merge_revision: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    merged_at: Option<chrono::DateTime<chrono::Utc>>,
    required_approvals: i32,
}

async fn get_change_request(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
) -> Result<Json<ChangeRequestDetail>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;

    let core = sqlx::query_as::<_, CrCore>(
        r#"
        SELECT cr.id, cr.number, cr.title, cr.state, cr.body,
               u.username AS author_username,
               cr.source_branch, cr.target_branch,
               cr.base_revision, cr.head_revision, cr.merge_revision,
               cr.created_at, cr.merged_at,
               r.required_approvals
        FROM change_requests cr
        JOIN repositories r ON r.id = cr.repo_id
        LEFT JOIN users u ON u.id = cr.author_id
        WHERE cr.repo_id = $1 AND cr.number = $2
        "#,
    )
    .bind(repo_id)
    .bind(number)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("change request not found"))?;

    let labels: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT l.name FROM cr_labels cl
        JOIN labels l ON l.id = cl.label_id
        WHERE cl.cr_id = $1 ORDER BY l.name ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    let reviewers: Vec<(String,)> = sqlx::query_as(
        r#"
        SELECT u.username FROM cr_reviewers crv
        JOIN users u ON u.id = crv.user_id
        WHERE crv.cr_id = $1 ORDER BY u.username ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    let linked_issues: Vec<(i32,)> = sqlx::query_as(
        r#"
        SELECT i.number FROM cr_linked_issues cli
        JOIN issues i ON i.id = cli.issue_id
        WHERE cli.cr_id = $1 ORDER BY i.number ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    let reviews = sqlx::query_as::<_, CrReview>(
        r#"
        SELECT u.username AS reviewer_username, rev.state, rev.body, rev.created_at
        FROM cr_reviews rev
        LEFT JOIN users u ON u.id = rev.reviewer_id
        WHERE rev.cr_id = $1 ORDER BY rev.created_at ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    let comments = sqlx::query_as::<_, CrComment>(
        r#"
        SELECT u.username AS author_username, c.body, c.created_at
        FROM cr_comments c
        LEFT JOIN users u ON u.id = c.author_id
        WHERE c.cr_id = $1 AND c.file_path IS NULL
        ORDER BY c.created_at ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    let inline_rows = sqlx::query_as::<_, CrInlineRow>(
        r#"
        SELECT u.username AS author_username, c.body, c.file_path, c.line,
               c.resolved, c.created_at
        FROM cr_comments c
        LEFT JOIN users u ON u.id = c.author_id
        WHERE c.cr_id = $1 AND c.file_path IS NOT NULL
        ORDER BY c.file_path ASC, c.line ASC, c.created_at ASC
        "#,
    )
    .bind(core.id)
    .fetch_all(&state.pool)
    .await?;

    // Group inline comments into threads keyed by (file_path, line). A thread is
    // resolved when its latest comment is marked resolved.
    let mut inline_threads: Vec<CrInlineThread> = Vec::new();
    for row in inline_rows {
        match inline_threads
            .last_mut()
            .filter(|t| t.file_path == row.file_path && t.line == row.line)
        {
            Some(thread) => {
                thread.resolved = row.resolved;
                thread.comments.push(CrInlineComment {
                    author_username: row.author_username,
                    body: row.body,
                    created_at: row.created_at,
                });
            }
            None => inline_threads.push(CrInlineThread {
                file_path: row.file_path,
                line: row.line,
                resolved: row.resolved,
                comments: vec![CrInlineComment {
                    author_username: row.author_username,
                    body: row.body,
                    created_at: row.created_at,
                }],
            }),
        }
    }

    let approvals = reviews.iter().filter(|r| r.state == "approved").count() as i64;

    Ok(Json(ChangeRequestDetail {
        number: core.number,
        title: core.title,
        state: core.state,
        body: core.body,
        author_username: core.author_username,
        source_branch: core.source_branch,
        target_branch: core.target_branch,
        base_revision: core.base_revision,
        head_revision: core.head_revision,
        merge_revision: core.merge_revision,
        created_at: core.created_at,
        merged_at: core.merged_at,
        labels: labels.into_iter().map(|(n,)| n).collect(),
        reviewers: reviewers.into_iter().map(|(n,)| n).collect(),
        linked_issues: linked_issues.into_iter().map(|(n,)| n).collect(),
        reviews,
        comments,
        inline_threads,
        approvals,
        required_approvals: core.required_approvals,
    }))
}

async fn resolve_cr_id(
    state: &AppState,
    repo_id: Uuid,
    number: i32,
) -> Result<Uuid, AppError> {
    let row: Option<(Uuid,)> =
        sqlx::query_as("SELECT id FROM change_requests WHERE repo_id = $1 AND number = $2")
            .bind(repo_id)
            .bind(number)
            .fetch_optional(&state.pool)
            .await?;
    row.map(|(id,)| id)
        .ok_or_else(|| AppError::not_found("change request not found"))
}

#[derive(Debug, Deserialize)]
pub struct CreateCrReviewRequest {
    pub state: String,
    pub body: Option<String>,
    pub reviewer_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct CrActionResult {
    pub number: i32,
}

async fn create_cr_review(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
    Json(request): Json<CreateCrReviewRequest>,
) -> Result<Json<CrActionResult>, AppError> {
    if !matches!(request.state.as_str(), "approved" | "commented" | "requested") {
        return Err(AppError::bad_request(
            "review state must be 'approved', 'commented', or 'requested'",
        ));
    }
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let cr_id = resolve_cr_id(&state, repo_id, number).await?;

    sqlx::query("INSERT INTO cr_reviews (cr_id, reviewer_id, state, body) VALUES ($1, $2, $3, $4)")
        .bind(cr_id)
        .bind(request.reviewer_id)
        .bind(request.state)
        .bind(request.body.unwrap_or_default())
        .execute(&state.pool)
        .await?;

    Ok(Json(CrActionResult { number }))
}

#[derive(Debug, Deserialize)]
pub struct CreateCrCommentRequest {
    pub body: String,
    pub file_path: Option<String>,
    pub line: Option<i32>,
    pub author_id: Option<Uuid>,
}

async fn create_cr_comment(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
    Json(request): Json<CreateCrCommentRequest>,
) -> Result<Json<CrActionResult>, AppError> {
    let body = request.body.trim().to_owned();
    if body.is_empty() {
        return Err(AppError::bad_request("comment body is required"));
    }
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let cr_id = resolve_cr_id(&state, repo_id, number).await?;
    let file_path = request
        .file_path
        .map(|p| p.trim().to_owned())
        .filter(|p| !p.is_empty());

    sqlx::query(
        "INSERT INTO cr_comments (cr_id, author_id, body, file_path, line) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(cr_id)
    .bind(request.author_id)
    .bind(body)
    .bind(file_path.as_deref())
    .bind(request.line.filter(|_| file_path.is_some()))
    .execute(&state.pool)
    .await?;

    Ok(Json(CrActionResult { number }))
}

async fn merge_change_request(
    State(state): State<AppState>,
    Path((org, repo, number)): Path<(String, String, i32)>,
) -> Result<Json<CrActionResult>, AppError> {
    let repo_id = resolve_repo_id(&state, &org, &repo).await?;
    let cr_id = resolve_cr_id(&state, repo_id, number).await?;

    // Enforce branch protection: required approvals must be met before merging.
    let gate: (i64, i32, String) = sqlx::query_as(
        r#"
        SELECT
            COUNT(DISTINCT rev.id) FILTER (WHERE rev.state = 'approved'),
            r.required_approvals,
            cr.state
        FROM change_requests cr
        JOIN repositories r ON r.id = cr.repo_id
        LEFT JOIN cr_reviews rev ON rev.cr_id = cr.id
        WHERE cr.id = $1
        GROUP BY r.required_approvals, cr.state
        "#,
    )
    .bind(cr_id)
    .fetch_one(&state.pool)
    .await?;

    let (approvals, required, current_state) = gate;
    if current_state == "merged" {
        return Err(AppError::bad_request("change request is already merged"));
    }
    if approvals < required as i64 {
        return Err(AppError::bad_request(
            "merge blocked: required approvals not met",
        ));
    }

    sqlx::query(
        "UPDATE change_requests SET state = 'merged', merged_at = now(), updated_at = now() WHERE id = $1",
    )
    .bind(cr_id)
    .execute(&state.pool)
    .await?;

    Ok(Json(CrActionResult { number }))
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
