use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct LoreClient {
    server_url: String,
}

#[derive(Debug, Clone)]
pub struct ProvisionedPartition {
    pub partition_id: [u8; 16],
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
}
