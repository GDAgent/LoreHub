import { demoStorageAnalytics, demoAssets } from "@/lib/demo-assets";

type AnalyticsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { org, repo } = await params;

  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">{org} / {repo}</div>
        <h1>Storage analytics</h1>
        <p className="muted">
          Phase 3 surfaces repository size, deduplication, chunk reuse, and asset-category breakdowns directly in the web UI.
        </p>
      </section>

      <section className="grid three top-gap">
        <article className="panel stat-panel">
          <span className="muted">Stored bytes</span>
          <strong>{(demoStorageAnalytics.totalBytes / (1024 * 1024)).toFixed(1)} MB</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Dedup savings</span>
          <strong>{demoStorageAnalytics.dedupSavingsPercent}%</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Shared chunks</span>
          <strong>{demoStorageAnalytics.sharedChunks}</strong>
        </article>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Tier breakdown</h2>
          <div className="tier-list top-gap-sm">
            {demoStorageAnalytics.tierBreakdown.map((tier) => (
              <div key={tier.name} className="tier-row">
                <div className="section-header">
                  <span>{tier.name}</span>
                  <span className="muted">{tier.percent}%</span>
                </div>
                <div className="tier-bar">
                  <span style={{ width: `${tier.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Asset chunk profile</h2>
          <div className="comment-thread top-gap-sm">
            {demoAssets.map((asset) => (
              <article key={asset.id} className="comment-card">
                <div className="section-header">
                  <strong>{asset.name}</strong>
                  <span className="pill muted-pill">{asset.chunkCount} chunks</span>
                </div>
                <p className="muted">{asset.sharedChunkCount} shared chunks reused from existing content.</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
