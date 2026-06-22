import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { demoAssets, demoStorageAnalytics } from "@/lib/demo-assets";
import { formatBytes } from "@/lib/demo-repository";

type AnalyticsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { org, repo } = await params;
  const a = demoStorageAnalytics;
  const totalChunks = a.sharedChunks + a.uniqueChunks;
  const immutablePct = Math.round((a.immutableStoreBytes / a.totalBytes) * 100);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="analytics" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Storage analytics</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Repository size, content-addressed deduplication, and chunk reuse across asset categories.</p>
        </div>
        <Link className="button-secondary" href={`/${org}/${repo}/assets`}>Asset browser</Link>
      </div>

      <section className="grid four">
        <article className="panel stat-panel">
          <span className="muted">Stored bytes</span>
          <strong>{formatBytes(a.totalBytes)}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Dedup savings</span>
          <strong style={{ color: "var(--success)" }}>{a.dedupSavingsPercent}%</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Shared chunks</span>
          <strong>{a.sharedChunks.toLocaleString()}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Unique chunks</span>
          <strong>{a.uniqueChunks.toLocaleString()}</strong>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Tier breakdown</h2>
          <div className="tier-list">
            {a.tierBreakdown.map((tier) => (
              <div key={tier.name} className="tier-row">
                <div className="section-header" style={{ alignItems: "baseline" }}>
                  <span>{tier.name}</span>
                  <span className="muted">{formatBytes(tier.bytes)} · {tier.percent}%</span>
                </div>
                <div className="tier-bar">
                  <span style={{ width: `${tier.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Store composition</h2>
          <div className="metadata-list">
            <div className="metadata-row"><span className="muted">Immutable store</span><strong>{formatBytes(a.immutableStoreBytes)} ({immutablePct}%)</strong></div>
            <div className="metadata-row"><span className="muted">Mutable store</span><strong>{formatBytes(a.mutableStoreBytes)} ({100 - immutablePct}%)</strong></div>
            <div className="metadata-row"><span className="muted">Total chunks</span><strong>{totalChunks.toLocaleString()}</strong></div>
            <div className="metadata-row"><span className="muted">Reuse ratio</span><strong>{Math.round((a.sharedChunks / totalChunks) * 100)}%</strong></div>
          </div>
          <div className="tier-bar" style={{ marginTop: "1rem" }} aria-hidden="true">
            <span style={{ width: `${immutablePct}%` }} />
          </div>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 0 }}>Immutable, content-addressed storage backs history; the mutable store holds working-tree state.</p>
        </article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Per-asset chunk profile</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Size</th>
              <th style={{ textAlign: "right" }}>Chunks</th>
              <th style={{ textAlign: "right" }}>Shared</th>
              <th style={{ textAlign: "right" }}>Reuse</th>
            </tr>
          </thead>
          <tbody>
            {demoAssets.map((asset) => (
              <tr key={asset.id}>
                <td><Link href={`/${org}/${repo}/assets/${asset.id}`}>{asset.name}</Link></td>
                <td><span className="pill muted-pill">{asset.type}</span></td>
                <td style={{ textAlign: "right" }}>{formatBytes(asset.sizeBytes)}</td>
                <td style={{ textAlign: "right" }}>{asset.chunkCount}</td>
                <td style={{ textAlign: "right" }}>{asset.sharedChunkCount}</td>
                <td style={{ textAlign: "right" }} className="highlight-cell">{Math.round((asset.sharedChunkCount / asset.chunkCount) * 100)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
