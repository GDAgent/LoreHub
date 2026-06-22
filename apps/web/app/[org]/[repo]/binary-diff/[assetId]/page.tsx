import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { getAsset, getAssetDiff } from "@/lib/demo-assets";
import { formatBytes } from "@/lib/demo-repository";

type BinaryDiffPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    assetId: string;
  }>;
};

export default async function BinaryDiffPage({ params }: BinaryDiffPageProps) {
  const { org, repo, assetId } = await params;
  const asset = getAsset(assetId);
  const diff = getAssetDiff(assetId);

  if (!asset || !diff) {
    notFound();
  }

  const sizeUp = diff.sizeDeltaBytes >= 0;

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
            <Link className="inline-link" href={`/${org}/${repo}/assets/${asset.id}`}>← {asset.name}</Link>
          </div>
          <h1 style={{ margin: 0 }}>Binary diff</h1>
          <div className="list-row-meta" style={{ marginTop: "0.35rem" }}>
            <code style={{ fontSize: "0.8em" }}>{asset.previousRevision}</code>
            <span>→</span>
            <code style={{ fontSize: "0.8em" }}>{asset.headRevision}</code>
          </div>
        </div>
        <span className="pill">{asset.type}</span>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>{diff.binarySummary}</p>

      <section className="grid three">
        <article className="panel stat-panel">
          <span className="muted">Size delta</span>
          <strong style={{ color: sizeUp ? "var(--danger)" : "var(--success)" }}>
            {sizeUp ? "+" : "−"}{formatBytes(Math.abs(diff.sizeDeltaBytes))}
          </strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Chunk delta</span>
          <strong>{diff.chunkDelta > 0 ? "+" : ""}{diff.chunkDelta}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">{asset.type === "image" ? "Changed pixels" : asset.type === "video" ? "Frames touched" : "Changed content"}</span>
          <strong>
            {asset.type === "image" && typeof diff.changedPixelsPercent === "number"
              ? `${diff.changedPixelsPercent}%`
              : asset.type === "video" && typeof diff.framesTouched === "number"
                ? diff.framesTouched
                : `${diff.chunkDelta} chunks`}
          </strong>
        </article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Visual diff</h2>
          {asset.type === "image" ? (
            <div className="pixel-diff-grid">
              {Array.from({ length: 64 }, (_, index) => (
                <span key={index} style={{ opacity: `${0.2 + ((index * 7) % 10) / 10}` }} />
              ))}
            </div>
          ) : asset.type === "audio" ? (
            <div className="audio-diff-wave">
              {diff.waveformDelta?.map((value, index) => (
                <span key={index} style={{ height: `${value + 25}%` }} />
              ))}
            </div>
          ) : asset.type === "model" ? (
            <div className="model-diff-wireframe" />
          ) : (
            <div className="video-diff-strip">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index}>{index + 1}</span>
              ))}
            </div>
          )}
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: 0 }}>
            Rendered from the content-addressed chunk delta between revisions — no full re-download required.
          </p>
        </article>

        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Type-specific delta</h2>
          <div className="metadata-list">
            {diff.perChannelDelta ? (
              <>
                <div className="metadata-row"><span className="muted">Red channel</span><strong>{diff.perChannelDelta.red}%</strong></div>
                <div className="metadata-row"><span className="muted">Green channel</span><strong>{diff.perChannelDelta.green}%</strong></div>
                <div className="metadata-row"><span className="muted">Blue channel</span><strong>{diff.perChannelDelta.blue}%</strong></div>
              </>
            ) : null}
            {diff.geometryDelta ? (
              <>
                <div className="metadata-row"><span className="muted">Triangles</span><strong>+{diff.geometryDelta.triangles.toLocaleString()}</strong></div>
                <div className="metadata-row"><span className="muted">Materials</span><strong>+{diff.geometryDelta.materials}</strong></div>
                <div className="metadata-row"><span className="muted">Bones</span><strong>+{diff.geometryDelta.bones}</strong></div>
              </>
            ) : null}
            {typeof diff.framesTouched === "number" ? (
              <>
                <div className="metadata-row"><span className="muted">Frames touched</span><strong>{diff.framesTouched}</strong></div>
                <div className="metadata-row"><span className="muted">Editorial timing</span><strong>Adjusted (final beat)</strong></div>
              </>
            ) : null}
            {diff.waveformDelta && !diff.perChannelDelta ? (
              <>
                <div className="metadata-row"><span className="muted">Sampled windows</span><strong>{diff.waveformDelta.length}</strong></div>
                <div className="metadata-row"><span className="muted">Noise floor</span><strong>Reduced vs. previous</strong></div>
              </>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
