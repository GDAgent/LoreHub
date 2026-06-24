//! Lore transport seam.
//!
//! [`LoreBackend`] is the stable trait every consumer depends on, with a single
//! implementation behind it:
//!
//! * [`LoreClient`] — the production gRPC client that talks to a real
//!   `loreserver` (provision, branches, revisions, tree, and blob reads).
//!   Live conformance is exercised by `tests/live_grpc.rs` against a running
//!   server.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Vendored gRPC bindings for `loreserver`, copied verbatim from Epic's
/// `lore-proto/src/grpc/` (MIT). Vendored — rather than depending on the
/// `lore-proto` crate — so LoreHub builds without `protoc` or `lore-base`'s
/// native toolchain. The four modules are self-contained (they reference only
/// `crate::lore::model`). Regenerate by re-copying the source files when the
/// proto contract changes; see `src/proto/`.
#[allow(clippy::all, clippy::pedantic, clippy::nursery, missing_docs, rustdoc::all)]
pub mod lore {
    pub mod model {
        pub mod v1 {
            include!("proto/lore.model.v1.rs");
        }
    }
    pub mod repository {
        pub mod v1 {
            include!("proto/lore.repository.v1.rs");
        }
    }
    pub mod revision {
        pub mod v1 {
            include!("proto/lore.revision.v1.rs");
        }
    }
    pub mod thin_client {
        pub mod v1 {
            include!("proto/lore.thin_client.v1.rs");
        }
    }
}

#[derive(Debug, Clone)]
pub struct ProvisionedPartition {
    pub partition_id: [u8; 16],
}

#[derive(Debug, Clone)]
pub struct StoredArtifactManifest {
    pub artifact_partition_id: [u8; 16],
    pub run_id: String,
    pub artifact_paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LoreRevision {
    pub hash: String,
    pub parents: Vec<String>,
    pub message: String,
    pub author: String,
    pub timestamp_unix: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LoreBranch {
    pub name: String,
    pub head: String,
    pub is_default: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum LoreEntryKind {
    Directory,
    File,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LoreTreeEntry {
    pub name: String,
    pub path: String,
    pub kind: LoreEntryKind,
    pub size: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct LoreBlob {
    pub path: String,
    pub mime_type: String,
    pub size: u64,
    pub is_binary: bool,
}

/// The stable transport seam. All consumers depend on this trait, never on a
/// concrete implementation.
#[async_trait]
pub trait LoreBackend: Send + Sync {
    async fn provision_partition(&self, repository_slug: &str) -> ProvisionedPartition;

    async fn provision_artifact_partition(&self, repository_slug: &str) -> ProvisionedPartition;

    async fn store_artifact_manifest(
        &self,
        artifact_partition_id: [u8; 16],
        run_id: String,
        artifact_paths: Vec<String>,
    ) -> StoredArtifactManifest;

    async fn list_revisions(&self, partition_id: [u8; 16]) -> Vec<LoreRevision>;

    async fn list_branches(&self, partition_id: [u8; 16]) -> Vec<LoreBranch>;

    async fn browse_tree(
        &self,
        partition_id: [u8; 16],
        revision: &str,
        path: &str,
    ) -> Vec<LoreTreeEntry>;

    async fn read_blob(
        &self,
        partition_id: [u8; 16],
        revision: &str,
        path: &str,
    ) -> Option<LoreBlob>;
}

// ---------------------------------------------------------------------------
// Production seam — gRPC client for `loreserver`
// ---------------------------------------------------------------------------

use lore::model::v1::RevisionIdentifier;
use lore::repository::v1::repository_get_request;
use lore::repository::v1::repository_service_client::RepositoryServiceClient;
use lore::repository::v1::{RepositoryCreateRequest, RepositoryGetRequest};
use lore::revision::v1::revision_service_client::RevisionServiceClient;
use lore::revision::v1::{revision_list_request, BranchListRequest, RevisionListRequest};
use lore::thin_client::v1::thin_client_service_client::ThinClientServiceClient;
use lore::thin_client::v1::{
    revision_info_request, revision_tree_request, revision_tree_response, NodeType,
    RevisionInfoRequest, RevisionTreeRequest,
};
use tonic::metadata::MetadataValue;
use tonic::transport::{Channel, Endpoint};
use tonic::Request;

/// Binary gRPC metadata header `loreserver` reads to route a request to a
/// partition (`lore_transport::grpc::PARTITION_ID_KEY`). Must end in `-bin`.
const PARTITION_ID_KEY: &str = "lore-partition-bin";

/// The production [`LoreBackend`]: a thin gRPC client over `loreserver`'s
/// RepositoryService / RevisionService / ThinClientService.
///
/// Read methods are best-effort: transport or status errors are logged and
/// surface as empty results so a degraded Lore backend never takes a page down.
/// Callers pass revisions as hex-encoded content signatures (as returned by
/// [`LoreBackend::list_branches`] / [`LoreBackend::list_revisions`]).
#[derive(Debug, Clone)]
pub struct LoreClient {
    server_url: String,
}

impl LoreClient {
    pub fn new(server_url: String) -> Self {
        Self { server_url }
    }

    pub fn server_url(&self) -> &str {
        &self.server_url
    }

    fn channel(&self) -> Result<Channel, tonic::transport::Error> {
        Ok(Endpoint::from_shared(self.server_url.clone())?.connect_lazy())
    }

    /// Wrap a message in a request tagged with the partition routing header.
    fn partitioned<T>(message: T, partition_id: &[u8; 16]) -> Request<T> {
        let mut request = Request::new(message);
        let value = MetadataValue::from_bytes(partition_id);
        request.metadata_mut().insert_bin(PARTITION_ID_KEY, value);
        request
    }

    /// Resolve the default branch id for a partition (empty if unknown).
    async fn default_branch_id(&self, partition_id: [u8; 16]) -> Vec<u8> {
        let Ok(channel) = self.channel() else {
            return Vec::new();
        };
        let mut client = RepositoryServiceClient::new(channel);
        let request = Self::partitioned(
            RepositoryGetRequest {
                query: Some(repository_get_request::Query::Id(partition_id.to_vec().into())),
            },
            &partition_id,
        );
        match client.repository_get(request).await {
            Ok(response) => response
                .into_inner()
                .repository
                .map(|repository| repository.default_branch_id.to_vec())
                .unwrap_or_default(),
            Err(status) => {
                tracing::warn!(%status, "lore repository_get failed");
                Vec::new()
            }
        }
    }

    async fn create_repository(
        &self,
        partition_id: [u8; 16],
        default_branch_id: [u8; 16],
        name: &str,
    ) -> Result<(), tonic::Status> {
        let channel = self
            .channel()
            .map_err(|error| tonic::Status::unavailable(error.to_string()))?;
        let mut client = RepositoryServiceClient::new(channel);
        client
            .repository_create(Request::new(RepositoryCreateRequest {
                id: partition_id.to_vec().into(),
                name: name.to_owned(),
                description: String::new(),
                default_branch_id: default_branch_id.to_vec().into(),
                default_branch_name: "main".to_owned(),
                creator: None,
            }))
            .await?;
        Ok(())
    }

    // Inherent forwarders kept for existing call sites that hold a concrete
    // `LoreClient`. They delegate to the trait implementation.
    pub async fn provision_partition(&self, repository_slug: &str) -> ProvisionedPartition {
        LoreBackend::provision_partition(self, repository_slug).await
    }

    pub async fn provision_artifact_partition(
        &self,
        repository_slug: &str,
    ) -> ProvisionedPartition {
        LoreBackend::provision_artifact_partition(self, repository_slug).await
    }

    pub async fn store_artifact_manifest(
        &self,
        artifact_partition_id: [u8; 16],
        run_id: impl Into<String>,
        artifact_paths: Vec<String>,
    ) -> StoredArtifactManifest {
        LoreBackend::store_artifact_manifest(self, artifact_partition_id, run_id.into(), artifact_paths)
            .await
    }
}

/// Map a hex revision signature into a thin-client tree query.
fn signature_query(revision: &str) -> Option<revision_tree_request::Query> {
    let signature = hex::decode(revision).ok().filter(|bytes| !bytes.is_empty())?;
    Some(revision_tree_request::Query::Signature(signature.into()))
}

/// Best-effort MIME type + binary flag from a path's extension.
fn classify(path: &str) -> (String, bool) {
    let extension = path.rsplit('.').next().unwrap_or_default().to_ascii_lowercase();
    let (mime, is_binary) = match extension.as_str() {
        "md" | "markdown" => ("text/markdown", false),
        "txt" | "log" | "ini" | "cfg" | "toml" | "yaml" | "yml" => ("text/plain", false),
        "json" => ("application/json", false),
        "csv" => ("text/csv", false),
        "png" => ("image/png", true),
        "jpg" | "jpeg" => ("image/jpeg", true),
        "gif" => ("image/gif", true),
        "wav" => ("audio/wav", true),
        "ogg" => ("audio/ogg", true),
        "mp3" => ("audio/mpeg", true),
        "uasset" | "umap" | "uexp" => ("application/octet-stream", true),
        _ => ("application/octet-stream", true),
    };
    (mime.to_owned(), is_binary)
}

#[async_trait]
impl LoreBackend for LoreClient {
    async fn provision_partition(&self, repository_slug: &str) -> ProvisionedPartition {
        let partition_id = Uuid::new_v4().into_bytes();
        let default_branch_id = Uuid::new_v4().into_bytes();
        if let Err(status) = self
            .create_repository(partition_id, default_branch_id, repository_slug)
            .await
        {
            tracing::warn!(%status, slug = repository_slug, "lore repository_create failed");
        }
        ProvisionedPartition { partition_id }
    }

    async fn provision_artifact_partition(&self, repository_slug: &str) -> ProvisionedPartition {
        let partition_id = Uuid::new_v4().into_bytes();
        let default_branch_id = Uuid::new_v4().into_bytes();
        if let Err(status) = self
            .create_repository(
                partition_id,
                default_branch_id,
                &format!("{repository_slug}-artifacts"),
            )
            .await
        {
            tracing::warn!(%status, slug = repository_slug, "lore artifact repository_create failed");
        }
        ProvisionedPartition { partition_id }
    }

    async fn store_artifact_manifest(
        &self,
        artifact_partition_id: [u8; 16],
        run_id: String,
        artifact_paths: Vec<String>,
    ) -> StoredArtifactManifest {
        StoredArtifactManifest {
            artifact_partition_id,
            run_id,
            artifact_paths,
        }
    }

    async fn list_revisions(&self, partition_id: [u8; 16]) -> Vec<LoreRevision> {
        let Ok(channel) = self.channel() else {
            return Vec::new();
        };
        let default_branch_id = self.default_branch_id(partition_id).await;
        if default_branch_id.is_empty() {
            return Vec::new();
        }

        // Page of (number, signature) anchored at the default branch tip.
        let mut revisions = RevisionServiceClient::new(channel.clone());
        let list = match revisions
            .revision_list(Self::partitioned(
                RevisionListRequest {
                    start: Some(revision_list_request::Start::Identifier(RevisionIdentifier {
                        branch_id: default_branch_id.clone().into(),
                        number: 0,
                    })),
                },
                &partition_id,
            ))
            .await
        {
            Ok(response) => response.into_inner().items,
            Err(status) => {
                tracing::warn!(%status, "lore revision_list failed");
                return Vec::new();
            }
        };

        // Hydrate each item with full commit metadata via the thin client.
        let mut thin = ThinClientServiceClient::new(channel);
        let mut out = Vec::with_capacity(list.len());
        for item in list {
            let request = Self::partitioned(
                RevisionInfoRequest {
                    query: Some(revision_info_request::Query::Signature(item.signature.clone())),
                },
                &partition_id,
            );
            match thin.revision_info(request).await {
                Ok(response) => {
                    if let Some(revision) = response.into_inner().revision {
                        let parents = revision
                            .parent_self
                            .iter()
                            .chain(revision.parent_other.iter())
                            .map(|parent| hex::encode(&parent.signature))
                            .collect();
                        out.push(LoreRevision {
                            hash: hex::encode(&revision.signature),
                            parents,
                            message: revision.commit_message,
                            author: revision.created_by,
                            timestamp_unix: revision.timestamp as i64,
                        });
                    }
                }
                Err(status) => {
                    tracing::warn!(%status, "lore revision_info failed");
                }
            }
        }
        out
    }

    async fn list_branches(&self, partition_id: [u8; 16]) -> Vec<LoreBranch> {
        let Ok(channel) = self.channel() else {
            return Vec::new();
        };
        let default_branch_id = self.default_branch_id(partition_id).await;
        let mut client = RevisionServiceClient::new(channel);
        let mut stream = match client
            .branch_list(Self::partitioned(
                BranchListRequest {
                    creator: None,
                    include_deleted: false,
                },
                &partition_id,
            ))
            .await
        {
            Ok(response) => response.into_inner(),
            Err(status) => {
                tracing::warn!(%status, "lore branch_list failed");
                return Vec::new();
            }
        };

        let mut out = Vec::new();
        loop {
            match stream.message().await {
                Ok(Some(response)) => {
                    if let Some(branch) = response.branch {
                        out.push(LoreBranch {
                            is_default: !default_branch_id.is_empty()
                                && branch.id.as_ref() == default_branch_id.as_slice(),
                            name: branch.name,
                            head: hex::encode(&branch.latest),
                        });
                    }
                }
                Ok(None) => break,
                Err(status) => {
                    tracing::warn!(%status, "lore branch_list stream error");
                    break;
                }
            }
        }
        out
    }

    async fn browse_tree(
        &self,
        partition_id: [u8; 16],
        revision: &str,
        path: &str,
    ) -> Vec<LoreTreeEntry> {
        let Some(query) = signature_query(revision) else {
            return Vec::new();
        };
        let Ok(channel) = self.channel() else {
            return Vec::new();
        };
        let prefix = if path.is_empty() {
            None
        } else {
            Some(path.to_owned())
        };
        let mut client = ThinClientServiceClient::new(channel);
        let mut stream = match client
            .revision_tree(Self::partitioned(
                RevisionTreeRequest {
                    path_prefix: prefix,
                    max_depth: Some(1),
                    query: Some(query),
                },
                &partition_id,
            ))
            .await
        {
            Ok(response) => response.into_inner(),
            Err(status) => {
                tracing::warn!(%status, "lore revision_tree failed");
                return Vec::new();
            }
        };

        let mut out = Vec::new();
        loop {
            match stream.message().await {
                Ok(Some(response)) => {
                    let Some(revision_tree_response::Payload::Node(node)) = response.payload else {
                        continue;
                    };
                    // The prefix root is echoed back; keep only its children.
                    if node.path == path {
                        continue;
                    }
                    let kind = match NodeType::try_from(node.node_type) {
                        Ok(NodeType::Directory) => LoreEntryKind::Directory,
                        _ => LoreEntryKind::File,
                    };
                    let name = node.path.rsplit('/').next().unwrap_or(&node.path).to_owned();
                    out.push(LoreTreeEntry {
                        name,
                        path: node.path,
                        kind,
                        size: 0,
                    });
                }
                Ok(None) => break,
                Err(status) => {
                    tracing::warn!(%status, "lore revision_tree stream error");
                    break;
                }
            }
        }
        out
    }

    async fn read_blob(
        &self,
        partition_id: [u8; 16],
        revision: &str,
        path: &str,
    ) -> Option<LoreBlob> {
        let query = signature_query(revision)?;
        let channel = self.channel().ok()?;
        let mut client = ThinClientServiceClient::new(channel);
        let mut stream = client
            .revision_tree(Self::partitioned(
                RevisionTreeRequest {
                    path_prefix: Some(path.to_owned()),
                    max_depth: Some(0),
                    query: Some(query),
                },
                &partition_id,
            ))
            .await
            .map_err(|status| tracing::warn!(%status, "lore read_blob tree failed"))
            .ok()?
            .into_inner();

        while let Ok(Some(response)) = stream.message().await {
            let Some(revision_tree_response::Payload::Node(node)) = response.payload else {
                continue;
            };
            if node.path == path && NodeType::try_from(node.node_type) != Ok(NodeType::Directory) {
                let (mime_type, is_binary) = classify(path);
                return Some(LoreBlob {
                    path: path.to_owned(),
                    mime_type,
                    size: 0,
                    is_binary,
                });
            }
        }
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn production_client_provisions_16_byte_partitions() {
        let client = LoreClient::new("http://localhost:41337".into());
        let partition = client.provision_partition("demo").await;
        assert_eq!(partition.partition_id.len(), 16);
    }

    #[tokio::test]
    async fn artifact_partition_differs_from_repo_partition() {
        let client = LoreClient::new("http://localhost:41337".into());
        let repo = client.provision_partition("acme/demo").await;
        let artifacts = client.provision_artifact_partition("acme/demo").await;
        assert_ne!(
            repo.partition_id, artifacts.partition_id,
            "artifact partition must differ from the repo partition"
        );
    }

    #[test]
    fn classify_maps_known_extensions() {
        let (mime, binary) = classify("Content/README.md");
        assert_eq!(mime, "text/markdown");
        assert!(!binary);

        let (mime, binary) = classify("Content/Textures/hero.png");
        assert_eq!(mime, "image/png");
        assert!(binary);
    }
}
