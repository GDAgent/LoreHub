use std::time::Duration;

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path,
    },
    response::Response,
    routing::get,
    Router,
};

use crate::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/api/v1/pipelines/{run_id}/logs/ws", get(log_stream))
}

async fn log_stream(Path(run_id): Path<String>, ws: WebSocketUpgrade) -> Response {
    ws.on_upgrade(move |socket| stream_logs(socket, run_id))
}

async fn stream_logs(mut socket: WebSocket, run_id: String) {
    let lines = demo_lines(&run_id);

    for line in lines {
        if socket.send(Message::Text(line.into())).await.is_err() {
            return;
        }

        tokio::time::sleep(Duration::from_millis(650)).await;
    }

    let _ = socket.send(Message::Close(None)).await;
}

fn demo_lines(run_id: &str) -> Vec<String> {
    vec![
        format!("[{run_id}] runner claimed job on ce-runner-01"),
        format!("[{run_id}] lore checkout --revision f34ab29ce810 --sparse Content/Textures Content/Audio"),
        format!("[{run_id}] restored cache from shared fragment store"),
        format!("[{run_id}] executing stage: validate"),
        format!("[{run_id}] executing stage: build"),
        format!("[{run_id}] executing stage: review-artifacts"),
        format!("[{run_id}] uploading artifacts into dedicated Lore CI partition"),
        format!("[{run_id}] pipeline completed successfully"),
    ]
}
