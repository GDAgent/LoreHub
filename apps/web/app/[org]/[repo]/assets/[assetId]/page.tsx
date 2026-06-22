import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { getAsset } from "@/lib/demo-assets";
import { formatBytes, getRevisionTreeLink } from "@/lib/demo-repository";

type AssetDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    assetId: string;
  }>;
};

function AssetPreview({ type, accent, secondaryAccent }: { type: string; accent: string; secondaryAccent: string }) {
  const style = { ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent };
  if (type === "image") return <div className="asset-preview image-preview" style={style} />;
  if (type === "audio") {
    return (
      <div className="asset-preview audio-preview" style={style}>
        {Array.from({ length: 28 }, (_, index) => (
          <span key={index} style={{ height: `${35 + ((index * 13) % 45)}%` }} />
        ))}
      </div>
    );
  }
  if (type === "model") return <div className="asset-preview model-preview" style={style} />;
  return <div className="asset-preview video-preview" style={style} />;
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { org, repo, assetId } = await params;
  const asset = getAsset(assetId);

  if (!asset) {
    notFound();
  }

  const dedup = Math.round((asset.sharedChunkCount / asset.chunkCount) * 100);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="assets" />
      </section>

      <div className="section-header">
        <div>
          <div className="meta-row" style={{ marginBottom: "0.35rem" }}>
            <Link className="inline-link" href={`/${org}/${repo}/assets`}>← Asset browser</Link>
          </div>
          <h1 style={{ margin: 0 }}>{asset.name}</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>{asset.description}</p>
        </div>
        <span className="pill">{asset.type}</span>
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <article className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <AssetPreview type={asset.type} accent={asset.preview.accent} secondaryAccent={asset.preview.secondaryAccent} />
            <p className="muted" style={{ margin: 0, padding: "0.85rem 1rem", fontSize: "0.88rem" }}>{asset.preview.caption}</p>
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Metadata</h2>
            <div className="metadata-list">
              {Object.entries(asset.metadata).map(([key, value]) => (
                <div key={key} className="metadata-row">
                  <span className="muted" style={{ textTransform: "capitalize" }}>{key}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2 style={{ marginTop: 0 }}>Chunk profile</h2>
            <div className="merge-box">
              <div className="merge-status">
                <span className="merge-dot ok" />
                <span>{asset.sharedChunkCount} of {asset.chunkCount} chunks reused from existing repository content</span>
              </div>
              <div className="merge-status">
                <span className="merge-dot muted" />
                <span>{asset.chunkCount - asset.sharedChunkCount} unique chunks stored for this revision</span>
              </div>
            </div>
            <div className="tier-bar" style={{ marginTop: "0.85rem" }} aria-hidden="true">
              <span style={{ width: `${dedup}%` }} />
            </div>
            <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 0 }}>{dedup}% of chunks shared — content-addressed dedup avoids re-uploading unchanged data.</p>
          </article>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Details</h3>
            <div className="metadata-list">
              <div className="metadata-row"><span className="muted">Path</span><code style={{ fontSize: "0.78rem" }}>{asset.path}</code></div>
              <div className="metadata-row"><span className="muted">MIME type</span><strong>{asset.mimeType}</strong></div>
              <div className="metadata-row"><span className="muted">Size</span><strong>{formatBytes(asset.sizeBytes)}</strong></div>
              <div className="metadata-row"><span className="muted">Chunks</span><strong>{asset.chunkCount}</strong></div>
              <div className="metadata-row"><span className="muted">Head</span><code style={{ fontSize: "0.78rem" }}>{asset.headRevision}</code></div>
              <div className="metadata-row"><span className="muted">Previous</span><code style={{ fontSize: "0.78rem" }}>{asset.previousRevision}</code></div>
            </div>
            {asset.tags.length ? (
              <div className="meta-row" style={{ marginTop: "0.85rem", flexWrap: "wrap" }}>
                {asset.tags.map((tag) => (
                  <span key={tag} className="pill muted-pill">{tag}</span>
                ))}
              </div>
            ) : null}
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Actions</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <Link className="button" href={`/${org}/${repo}/binary-diff/${asset.id}`}>Open binary diff</Link>
              <Link className="button-secondary" href={`/${org}/${repo}/locks?lockPath=${encodeURIComponent(asset.path)}&action=lock`}>Lock asset</Link>
              <Link className="button-secondary" href={`/${org}/${repo}/${getRevisionTreeLink(asset.headRevision)}`}>Browse at head</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
