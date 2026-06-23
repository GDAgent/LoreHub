use axum::{
    extract::{Path, State},
    routing::get,
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use crate::{error::AppError, AppState};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/orgs/{org}", get(get_org))
        .route("/api/v1/orgs/{org}/members", get(list_members))
        .route(
            "/api/v1/orgs/{org}/teams",
            get(list_teams).post(create_team),
        )
}

async fn resolve_org_id(state: &AppState, org: &str) -> Result<Uuid, AppError> {
    let row: Option<(Uuid,)> = sqlx::query_as("SELECT id FROM organizations WHERE name = $1")
        .bind(org)
        .fetch_optional(&state.pool)
        .await?;
    row.map(|(id,)| id)
        .ok_or_else(|| AppError::not_found("organization not found"))
}

#[derive(Debug, Serialize, FromRow)]
pub struct OrgDetail {
    pub name: String,
    pub display_name: String,
    pub plan: String,
    pub member_count: i64,
}

async fn get_org(
    State(state): State<AppState>,
    Path(org): Path<String>,
) -> Result<Json<OrgDetail>, AppError> {
    let detail = sqlx::query_as::<_, OrgDetail>(
        r#"
        SELECT o.name, o.display_name, o.plan,
               COUNT(m.user_id) AS member_count
        FROM organizations o
        LEFT JOIN org_members m ON m.org_id = o.id
        WHERE o.name = $1
        GROUP BY o.id
        "#,
    )
    .bind(&org)
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(|| AppError::not_found("organization not found"))?;

    Ok(Json(detail))
}

#[derive(Debug, Serialize, FromRow)]
pub struct OrgMember {
    pub username: String,
    pub display_name: String,
    pub title: Option<String>,
    pub avatar_initials: Option<String>,
    pub role: String,
}

async fn list_members(
    State(state): State<AppState>,
    Path(org): Path<String>,
) -> Result<Json<Vec<OrgMember>>, AppError> {
    let org_id = resolve_org_id(&state, &org).await?;
    let members = sqlx::query_as::<_, OrgMember>(
        r#"
        SELECT u.username, u.display_name, u.title, u.avatar_initials, m.role
        FROM org_members m
        JOIN users u ON u.id = m.user_id
        WHERE m.org_id = $1
        ORDER BY u.display_name ASC
        "#,
    )
    .bind(org_id)
    .fetch_all(&state.pool)
    .await?;

    Ok(Json(members))
}

#[derive(Debug, Serialize)]
pub struct TeamItem {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub members: Vec<String>,
}

#[derive(Debug, FromRow)]
struct TeamRow {
    id: Uuid,
    slug: String,
    name: String,
    description: Option<String>,
}

async fn list_teams(
    State(state): State<AppState>,
    Path(org): Path<String>,
) -> Result<Json<Vec<TeamItem>>, AppError> {
    let org_id = resolve_org_id(&state, &org).await?;
    let teams = sqlx::query_as::<_, TeamRow>(
        r#"
        SELECT id, slug, name, description
        FROM teams
        WHERE org_id = $1
        ORDER BY name ASC
        "#,
    )
    .bind(org_id)
    .fetch_all(&state.pool)
    .await?;

    let mut items = Vec::with_capacity(teams.len());
    for team in teams {
        let members: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT u.display_name
            FROM team_members tm
            JOIN users u ON u.id = tm.user_id
            WHERE tm.team_id = $1
            ORDER BY u.display_name ASC
            "#,
        )
        .bind(team.id)
        .fetch_all(&state.pool)
        .await?;

        items.push(TeamItem {
            slug: team.slug,
            name: team.name,
            description: team.description,
            members: members.into_iter().map(|(n,)| n).collect(),
        });
    }

    Ok(Json(items))
}

#[derive(Debug, Deserialize)]
pub struct CreateTeamRequest {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CreatedTeam {
    pub slug: String,
}

fn slugify(name: &str) -> String {
    let slug: String = name
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| if c.is_alphanumeric() { c } else { '-' })
        .collect();
    slug.split('-')
        .filter(|s| !s.is_empty())
        .collect::<Vec<_>>()
        .join("-")
}

async fn create_team(
    State(state): State<AppState>,
    Path(org): Path<String>,
    Json(request): Json<CreateTeamRequest>,
) -> Result<Json<CreatedTeam>, AppError> {
    let org_id = resolve_org_id(&state, &org).await?;
    let name = request.name.trim().to_owned();
    if name.is_empty() {
        return Err(AppError::bad_request("team name is required"));
    }
    let slug = slugify(&name);
    if slug.is_empty() {
        return Err(AppError::bad_request("team name must contain letters or digits"));
    }

    let created = sqlx::query_as::<_, (String,)>(
        r#"
        INSERT INTO teams (org_id, slug, name, description)
        VALUES ($1, $2, $3, $4)
        RETURNING slug
        "#,
    )
    .bind(org_id)
    .bind(slug)
    .bind(name)
    .bind(request.description)
    .fetch_one(&state.pool)
    .await?;

    Ok(Json(CreatedTeam { slug: created.0 }))
}
