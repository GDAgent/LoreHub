mod runner;

use std::time::Duration;

use lore_client::LoreClient;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let env_filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info"));

    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(env_filter)
        .init();

    let lore_server_url =
        std::env::var("LORE_SERVER_URL").unwrap_or_else(|_| "http://localhost:8081".to_owned());

    let lore_client = LoreClient::new(lore_server_url.clone());

    if std::env::args().nth(1).as_deref() == Some("--runner-demo") {
        runner::run_demo(&lore_client).await?;
        return Ok(());
    }

    let mut interval = tokio::time::interval(Duration::from_secs(30));

    tracing::info!(lore_server_url = %lore_client.server_url(), "worker started");

    loop {
        interval.tick().await;
        tracing::info!("worker heartbeat");
    }
}
