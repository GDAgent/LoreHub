import { notFound } from "next/navigation";

import { getAsset, getAssetDiff } from "@/lib/demo-assets";

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

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>Binary diff: {asset.name}</h1>
          </div>
          <span className="pill">{asset.type}</span>
        </div>
        <p className="muted">{diff.binarySummary}</p>
      </section>

      <section className="grid three top-gap">
        <article className="panel stat-panel">
          <span className="muted">Size delta</span>
          <strong>{diff.sizeDeltaBytes > 0 ? "+" : ""}{(diff.sizeDeltaBytes / 1024).toFixed(1)} KB</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Chunk delta</span>
          <strong>{diff.chunkDelta > 0 ? "+" : ""}{diff.chunkDelta}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Changed pixels</span>
          <strong>{diff.changedPixelsPercent ? `${diff.changedPixelsPercent}%` : "N/A"}</strong>
        </article>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Visual diff</h2>
          {asset.type === "image" ? (
            <div className="pixel-diff-grid top-gap-sm">
              {Array.from({ length: 64 }, (_, index) => (
                <span key={index} style={{ opacity: `${0.2 + ((index * 7) % 10) / 10}` }} />
              ))}
            </div>
          ) : asset.type === "audio" ? (
            <div className="audio-diff-wave top-gap-sm">
              {diff.waveformDelta?.map((value, index) => (
                <span key={index} style={{ height: `${value + 25}%` }} />
              ))}
            </div>
          ) : asset.type === "model" ? (
            <div className="model-diff-wireframe top-gap-sm" />
          ) : (
            <div className="video-diff-strip top-gap-sm">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={index}>{index + 1}</span>
              ))}
            </div>
          )}
        </article>

        <article className="panel">
          <h2>Type-specific delta</h2>
          {diff.perChannelDelta ? (
            <ul className="list">
              <li>Red channel delta: {diff.perChannelDelta.red}%</li>
              <li>Green channel delta: {diff.perChannelDelta.green}%</li>
              <li>Blue channel delta: {diff.perChannelDelta.blue}%</li>
            </ul>
          ) : null}
          {diff.geometryDelta ? (
            <ul className="list">
              <li>Triangles: +{diff.geometryDelta.triangles}</li>
              <li>Materials: +{diff.geometryDelta.materials}</li>
              <li>Bones: +{diff.geometryDelta.bones}</li>
            </ul>
          ) : null}
          {typeof diff.framesTouched === "number" ? (
            <ul className="list">
              <li>Frames touched: {diff.framesTouched}</li>
              <li>Editorial timing adjusted in the final act beat</li>
            </ul>
          ) : null}
          {diff.waveformDelta ? (
            <ul className="list">
              <li>Waveform peaks updated across 12 sampled windows</li>
              <li>Noise floor reduced relative to the previous loop</li>
            </ul>
          ) : null}
        </article>
      </section>
    </main>
  );
}
