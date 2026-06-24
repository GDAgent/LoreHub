mod auth;
mod config;
mod error;
mod routes;

use std::{net::SocketAddr, sync::Arc};

use axum::Router;
use config::Config;
use lore_client::{LoreBackend, LoreClient};
use sqlx::postgres::PgPoolOptions;
use tower_http::{cors::CorsLayer, trace::TraceLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

use crate::auth::TokenIssuer;

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub lore_client: Arc<dyn LoreBackend>,
    pub token_issuer: Arc<TokenIssuer>,
    pub lore_server_url: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    init_tracing();

    let config = Config::from_env();
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("../../migrations").run(&pool).await?;

    tracing::info!(url = %config.lore_server_url, "using gRPC lore backend");
    let lore_client: Arc<dyn LoreBackend> =
        Arc::new(LoreClient::new(config.lore_server_url.clone()));

    let app_state = AppState {
        pool,
        lore_client,
        token_issuer: Arc::new(TokenIssuer::new(
            config.lore_jwt_secret,
            config.lore_jwt_issuer,
        )),
        lore_server_url: config.lore_server_url,
    };

    let app = Router::new()
        .merge(routes::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(app_state);

    let address = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = tokio::net::TcpListener::bind(address).await?;

    tracing::info!(%address, "api listening");
    axum::serve(listener, app).await?;
    Ok(())
}

fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(env_filter)
        .init();
}
