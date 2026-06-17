mod health;
mod repositories;

use axum::Router;

pub fn router() -> Router<crate::AppState> {
    Router::new()
        .merge(health::routes())
        .merge(repositories::routes())
}
