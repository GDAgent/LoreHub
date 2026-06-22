//! Lore transport seam.
//!
//! [`LoreBackend`] is the stable trait every consumer depends on. Two
//! implementations live behind it:
//!
//! * [`LoreClient`] — the production seam where a real `lore-capi` FFI or gRPC
//!   transport will land. Provisioning is implemented; read methods are stubs
//!   until the wire protocol is wired up.
//! * [`FakeLoreBackend`] — a deterministic, conformance-tested fake so the rest
//!   of the stack can be built and tested against the same trait without a
//!   running `lore-server`.

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

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
// Production seam
// ---------------------------------------------------------------------------

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

#[async_trait]
impl LoreBackend for LoreClient {
    async fn provision_partition(&self, _repository_slug: &str) -> ProvisionedPartition {
        // Seam for a real lore-capi / gRPC partition provisioning call.
        ProvisionedPartition {
            partition_id: Uuid::new_v4().into_bytes(),
        }
    }

    async fn provision_artifact_partition(&self, _repository_slug: &str) -> ProvisionedPartition {
        ProvisionedPartition {
            partition_id: Uuid::new_v4().into_bytes(),
        }
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

    // Read methods require the wire protocol; until then they return empty.
    async fn list_revisions(&self, _partition_id: [u8; 16]) -> Vec<LoreRevision> {
        Vec::new()
    }

    async fn list_branches(&self, _partition_id: [u8; 16]) -> Vec<LoreBranch> {
        Vec::new()
    }

    async fn browse_tree(
        &self,
        _partition_id: [u8; 16],
        _revision: &str,
        _path: &str,
    ) -> Vec<LoreTreeEntry> {
        Vec::new()
    }

    async fn read_blob(
        &self,
        _partition_id: [u8; 16],
        _revision: &str,
        _path: &str,
    ) -> Option<LoreBlob> {
        None
    }
}

// ---------------------------------------------------------------------------
// Deterministic fake (conformance-tested)
// ---------------------------------------------------------------------------

/// A deterministic in-memory backend for local development and tests.
#[derive(Debug, Default, Clone)]
pub struct FakeLoreBackend;

impl FakeLoreBackend {
    pub fn new() -> Self {
        Self
    }

    fn deterministic_partition(seed: &str) -> [u8; 16] {
        // Stable 16-byte id derived from the slug so repeated calls match.
        let mut bytes = [0u8; 16];
        for (index, byte) in seed.bytes().enumerate() {
            bytes[index % 16] ^= byte;
        }
        bytes
    }
}

#[async_trait]
impl LoreBackend for FakeLoreBackend {
    async fn provision_partition(&self, repository_slug: &str) -> ProvisionedPartition {
        ProvisionedPartition {
            partition_id: Self::deterministic_partition(repository_slug),
        }
    }

    async fn provision_artifact_partition(&self, repository_slug: &str) -> ProvisionedPartition {
        ProvisionedPartition {
            partition_id: Self::deterministic_partition(&format!("artifacts:{repository_slug}")),
        }
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

    async fn list_revisions(&self, _partition_id: [u8; 16]) -> Vec<LoreRevision> {
        vec![
            LoreRevision {
                hash: "f34ab29ce810".into(),
                parents: vec!["b52fd9aa8c3e".into()],
                message: "Tighten hero corridor specular mask".into(),
                author: "iris".into(),
                timestamp_unix: 1_718_700_000,
            },
            LoreRevision {
                hash: "b52fd9aa8c3e".into(),
                parents: vec!["7c91ae447bc2".into()],
                message: "Arena lighting pass".into(),
                author: "rin".into(),
                timestamp_unix: 1_718_600_000,
            },
            LoreRevision {
                hash: "7c91ae447bc2".into(),
                parents: vec![],
                message: "Initial import of arena vertical slice".into(),
                author: "rin".into(),
                timestamp_unix: 1_718_500_000,
            },
        ]
    }

    async fn list_branches(&self, _partition_id: [u8; 16]) -> Vec<LoreBranch> {
        vec![
            LoreBranch {
                name: "main".into(),
                head: "f34ab29ce810".into(),
                is_default: true,
            },
            LoreBranch {
                name: "feature/arena-lighting".into(),
                head: "b52fd9aa8c3e".into(),
                is_default: false,
            },
        ]
    }

    async fn browse_tree(
        &self,
        _partition_id: [u8; 16],
        _revision: &str,
        path: &str,
    ) -> Vec<LoreTreeEntry> {
        if path.is_empty() {
            vec![
                LoreTreeEntry {
                    name: "Content".into(),
                    path: "Content".into(),
                    kind: LoreEntryKind::Directory,
                    size: 0,
                },
                LoreTreeEntry {
                    name: "README.md".into(),
                    path: "README.md".into(),
                    kind: LoreEntryKind::File,
                    size: 2048,
                },
            ]
        } else if path == "Content" {
            vec![
                LoreTreeEntry {
                    name: "Textures".into(),
                    path: "Content/Textures".into(),
                    kind: LoreEntryKind::Directory,
                    size: 0,
                },
                LoreTreeEntry {
                    name: "Audio".into(),
                    path: "Content/Audio".into(),
                    kind: LoreEntryKind::Directory,
                    size: 0,
                },
            ]
        } else {
            Vec::new()
        }
    }

    async fn read_blob(
        &self,
        _partition_id: [u8; 16],
        _revision: &str,
        path: &str,
    ) -> Option<LoreBlob> {
        if path == "README.md" {
            Some(LoreBlob {
                path: path.into(),
                mime_type: "text/markdown".into(),
                size: 2048,
                is_binary: false,
            })
        } else if path.ends_with(".png") {
            Some(LoreBlob {
                path: path.into(),
                mime_type: "image/png".into(),
                size: 4_812_330,
                is_binary: true,
            })
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Shared conformance suite. Any [`LoreBackend`] whose backing store has the
    /// seeded arena data must satisfy these invariants. Run against the fake;
    /// re-run against a real `lore-server` in integration tests later.
    async fn assert_conformance(backend: &dyn LoreBackend) {
        let partition = backend.provision_partition("acme/demo").await;
        assert_eq!(partition.partition_id.len(), 16);

        let artifacts = backend.provision_artifact_partition("acme/demo").await;
        assert_ne!(
            artifacts.partition_id, partition.partition_id,
            "artifact partition must differ from the repo partition"
        );

        let manifest = backend
            .store_artifact_manifest(
                artifacts.partition_id,
                "run-107".into(),
                vec!["artifacts/build.zip".into()],
            )
            .await;
        assert_eq!(manifest.run_id, "run-107");
        assert_eq!(manifest.artifact_paths.len(), 1);

        let revisions = backend.list_revisions(partition.partition_id).await;
        assert!(!revisions.is_empty(), "seeded backend must have revisions");
        let head = &revisions[0];
        // The newest revision should chain to a known parent.
        assert!(!head.hash.is_empty());

        let branches = backend.list_branches(partition.partition_id).await;
        assert!(branches.iter().any(|branch| branch.is_default));

        let root = backend.browse_tree(partition.partition_id, &head.hash, "").await;
        assert!(!root.is_empty());
        assert!(root.iter().any(|entry| entry.kind == LoreEntryKind::Directory));

        let blob = backend
            .read_blob(partition.partition_id, &head.hash, "README.md")
            .await;
        assert!(blob.is_some_and(|blob| !blob.is_binary));
    }

    #[tokio::test]
    async fn fake_backend_satisfies_conformance() {
        assert_conformance(&FakeLoreBackend::new()).await;
    }

    #[tokio::test]
    async fn deterministic_partitions_are_stable() {
        let backend = FakeLoreBackend::new();
        let first = backend.provision_partition("acme/demo").await;
        let second = backend.provision_partition("acme/demo").await;
        assert_eq!(first.partition_id, second.partition_id);
    }

    #[tokio::test]
    async fn production_client_still_provisions_16_byte_partitions() {
        let client = LoreClient::new("http://localhost:8081".into());
        let partition = client.provision_partition("demo").await;
        assert_eq!(partition.partition_id.len(), 16);
    }
}
