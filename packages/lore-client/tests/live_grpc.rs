//! Live gRPC conformance against a running `loreserver`.
//!
//! Ignored by default — it needs a server. Start one (zero-config:
//! `loreserver`) and run:
//!
//! ```sh
//! LORE_SERVER_URL=http://127.0.0.1:41337 \
//!   cargo test -p lore-client --test live_grpc -- --ignored --nocapture
//! ```
use lore_client::{LoreBackend, LoreClient};

fn server_url() -> String {
    std::env::var("LORE_SERVER_URL").unwrap_or_else(|_| "http://127.0.0.1:41337".into())
}

#[tokio::test]
#[ignore = "requires a running loreserver"]
async fn provision_then_list_default_branch() {
    let client = LoreClient::new(server_url());

    // RepositoryCreate over gRPC; the server seeds the default branch.
    let partition = client.provision_partition("live-grpc-test").await;
    assert_eq!(partition.partition_id.len(), 16);

    // RepositoryGet (for the default flag) + BranchList over gRPC, routed by
    // the partition metadata header.
    let branches = client.list_branches(partition.partition_id).await;
    assert!(
        branches.iter().any(|branch| branch.is_default && branch.name == "main"),
        "freshly provisioned repo must expose its default `main` branch, got {branches:?}"
    );

    // No commits yet on a fresh repo.
    let revisions = client.list_revisions(partition.partition_id).await;
    assert!(revisions.is_empty(), "fresh repo should have no revisions");
}
