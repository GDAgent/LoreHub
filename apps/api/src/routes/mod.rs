mod auth;
mod collaboration;
mod health;
mod organizations;
mod pipelines;
mod repositories;

use axum::Router;

pub fn router() -> Router<crate::AppState> {
    Router::new()
        .merge(health::routes())
        .merge(auth::routes())
        .merge(pipelines::routes())
        .merge(repositories::routes())
        .merge(collaboration::routes())
        .merge(organizations::routes())
}
