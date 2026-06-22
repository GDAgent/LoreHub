use axum::{extract::State, routing::post, Json, Router};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use chrono::{Duration, Utc};
use db_types::User;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{
    auth::{generate_session_token, hash_password, hash_token, verify_password, CurrentUser, SESSION_COOKIE},
    error::AppError,
    AppState,
};

const SESSION_TTL_DAYS: i64 = 30;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/auth/register", post(register))
        .route("/api/v1/auth/login", post(login))
        .route("/api/v1/auth/logout", post(logout))
        .route("/api/v1/auth/me", axum::routing::get(me))
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub username: String,
    pub email: String,
    pub display_name: String,
    pub title: Option<String>,
    pub avatar_initials: Option<String>,
}

impl From<User> for UserResponse {
    fn from(user: User) -> Self {
        Self {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name,
            title: user.title,
            avatar_initials: user.avatar_initials,
        }
    }
}

/// Insert a session row and return the opaque token to hand to the client.
async fn create_session(state: &AppState, user_id: Uuid) -> Result<String, AppError> {
    let token = generate_session_token();
    let token_hash = hash_token(&token);
    let expires_at = Utc::now() + Duration::days(SESSION_TTL_DAYS);

    sqlx::query("INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)")
        .bind(user_id)
        .bind(token_hash)
        .bind(expires_at)
        .execute(&state.pool)
        .await?;

    Ok(token)
}

fn session_cookie(token: String) -> Cookie<'static> {
    Cookie::build((SESSION_COOKIE, token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .max_age(time::Duration::days(SESSION_TTL_DAYS))
        .build()
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub display_name: String,
    pub password: String,
}

async fn register(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(request): Json<RegisterRequest>,
) -> Result<(CookieJar, Json<UserResponse>), AppError> {
    let username = request.username.trim().to_lowercase();
    let email = request.email.trim().to_lowercase();
    let display_name = request.display_name.trim().to_owned();

    if username.is_empty() || email.is_empty() || display_name.is_empty() {
        return Err(AppError::bad_request(
            "username, email, and display name are required",
        ));
    }
    if request.password.len() < 12 {
        return Err(AppError::bad_request(
            "password must be at least 12 characters",
        ));
    }

    let password_hash = hash_password(&request.password)?;
    let avatar_initials: String = display_name
        .split_whitespace()
        .filter_map(|word| word.chars().next())
        .take(2)
        .collect::<String>()
        .to_uppercase();

    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (email, username, display_name, password_hash, avatar_initials)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, username, display_name, title, avatar_initials, created_at
        "#,
    )
    .bind(&email)
    .bind(&username)
    .bind(&display_name)
    .bind(password_hash)
    .bind(avatar_initials)
    .fetch_one(&state.pool)
    .await?;

    let token = create_session(&state, user.id).await?;
    let jar = jar.add(session_cookie(token));
    Ok((jar, Json(user.into())))
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    /// Username or email.
    pub login: String,
    pub password: String,
}

#[derive(sqlx::FromRow)]
struct Credential {
    id: Uuid,
    password_hash: Option<String>,
}

async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(request): Json<LoginRequest>,
) -> Result<(CookieJar, Json<UserResponse>), AppError> {
    let login = request.login.trim().to_lowercase();

    let credential = sqlx::query_as::<_, Credential>(
        "SELECT id, password_hash FROM users WHERE username = $1 OR email = $1",
    )
    .bind(&login)
    .fetch_optional(&state.pool)
    .await?;

    let credential = credential.ok_or_else(|| AppError::unauthorized("invalid credentials"))?;
    let hash = credential
        .password_hash
        .as_deref()
        .ok_or_else(|| AppError::unauthorized("password sign-in is not enabled for this account"))?;

    if !verify_password(&request.password, hash) {
        return Err(AppError::unauthorized("invalid credentials"));
    }

    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, username, display_name, title, avatar_initials, created_at
        FROM users WHERE id = $1
        "#,
    )
    .bind(credential.id)
    .fetch_one(&state.pool)
    .await?;

    let token = create_session(&state, user.id).await?;
    let jar = jar.add(session_cookie(token));
    Ok((jar, Json(user.into())))
}

async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<(CookieJar, Json<serde_json::Value>), AppError> {
    if let Some(cookie) = jar.get(SESSION_COOKIE) {
        let token_hash = hash_token(cookie.value());
        sqlx::query("DELETE FROM sessions WHERE token_hash = $1")
            .bind(token_hash)
            .execute(&state.pool)
            .await?;
    }

    let jar = jar.remove(Cookie::from(SESSION_COOKIE));
    Ok((jar, Json(serde_json::json!({ "ok": true }))))
}

async fn me(CurrentUser(user): CurrentUser) -> Json<UserResponse> {
    Json(user.into())
}
