mod health;
mod pipelines;
mod repositories;

use axum::Router;

pub fn router() -> Router<crate::AppState> {
    Router::new()
        .merge(health::routes())
        .merge(pipelines::routes())
        .merge(repositories::routes())
}
