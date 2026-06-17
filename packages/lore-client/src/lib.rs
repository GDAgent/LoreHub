use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct LoreClient {
    server_url: String,
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

impl LoreClient {
    pub fn new(server_url: String) -> Self {
        Self { server_url }
    }

    pub fn server_url(&self) -> &str {
        &self.server_url
    }

    pub async fn provision_partition(&self, _repository_slug: &str) -> ProvisionedPartition {
        // This crate is the seam where a real lore-capi or gRPC implementation will land.
        ProvisionedPartition {
            partition_id: Uuid::new_v4().into_bytes(),
        }
    }

    pub async fn provision_artifact_partition(
        &self,
        _repository_slug: &str,
    ) -> ProvisionedPartition {
        ProvisionedPartition {
            partition_id: Uuid::new_v4().into_bytes(),
        }
    }

    pub async fn store_artifact_manifest(
        &self,
        artifact_partition_id: [u8; 16],
        run_id: impl Into<String>,
        artifact_paths: Vec<String>,
    ) -> StoredArtifactManifest {
        StoredArtifactManifest {
            artifact_partition_id,
            run_id: run_id.into(),
            artifact_paths,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::LoreClient;

    #[tokio::test]
    async fn provisions_16_byte_partitions() {
        let client = LoreClient::new("http://localhost:8081".into());
        let partition = client.provision_partition("demo").await;

        assert_eq!(partition.partition_id.len(), 16);
    }

    #[tokio::test]
    async fn stores_artifact_manifests_against_partitions() {
        let client = LoreClient::new("http://localhost:8081".into());
        let partition = client.provision_artifact_partition("demo").await;
        let manifest = client
            .store_artifact_manifest(
                partition.partition_id,
                "run-107",
                vec!["artifacts/build.zip".into(), "artifacts/report.xml".into()],
            )
            .await;

        assert_eq!(manifest.artifact_partition_id.len(), 16);
        assert_eq!(manifest.run_id, "run-107");
        assert_eq!(manifest.artifact_paths.len(), 2);
    }
}
