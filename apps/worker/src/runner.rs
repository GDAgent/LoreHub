use anyhow::Result;
use lore_client::{LoreClient, StoredArtifactManifest};

pub struct RunnerJob {
    pub repo_slug: String,
    pub revision: String,
    pub sparse_paths: Vec<String>,
    pub run_id: String,
}

pub async fn run_demo(lore_client: &LoreClient) -> Result<()> {
    let job = RunnerJob {
        repo_slug: "acme/demo".into(),
        revision: "f34ab29ce810".into(),
        sparse_paths: vec![
            "Content/Textures".into(),
            "Content/Audio".into(),
            ".lorehub".into(),
        ],
        run_id: "run-107".into(),
    };

    tracing::info!(command = %checkout_command(&job), "runner checkout command prepared");

    let artifact_partition = lore_client
        .provision_artifact_partition(&job.repo_slug)
        .await;
    let manifest = lore_client
        .store_artifact_manifest(
            artifact_partition.partition_id,
            job.run_id.clone(),
            vec![
                "artifacts/demo-windows.zip".into(),
                "artifacts/junit.xml".into(),
                "artifacts/review-capture.webm".into(),
            ],
        )
        .await;

    log_manifest(&manifest);
    Ok(())
}

pub fn checkout_command(job: &RunnerJob) -> String {
    let sparse = job.sparse_paths.join(" ");
    format!(
        "lore checkout --remote lorehub --revision {} --sparse {}",
        job.revision, sparse
    )
}

fn log_manifest(manifest: &StoredArtifactManifest) {
    tracing::info!(
        run_id = %manifest.run_id,
        artifact_count = manifest.artifact_paths.len(),
        "artifact manifest stored in Lore CI partition"
    );
}

#[cfg(test)]
mod tests {
    use super::{checkout_command, RunnerJob};

    #[test]
    fn builds_lore_checkout_commands_for_sparse_workspaces() {
        let command = checkout_command(&RunnerJob {
            repo_slug: "acme/demo".into(),
            revision: "f34ab29ce810".into(),
            sparse_paths: vec!["Content/Textures".into(), ".lorehub".into()],
            run_id: "run-107".into(),
        });

        assert!(command.contains("lore checkout"));
        assert!(command.contains("--revision f34ab29ce810"));
        assert!(command.contains("Content/Textures .lorehub"));
    }
}
