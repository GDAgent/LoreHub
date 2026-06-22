import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { listAssets } from "@/lib/demo-assets";
import { formatBytes } from "@/lib/demo-repository";
import { getSearchParamValue } from "@/lib/search-params";

type AssetsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TYPES = ["all", "image", "audio", "model", "video"] as const;

function AssetPreview({ type, accent, secondaryAccent }: { type: string; accent: string; secondaryAccent: string }) {
  const style = { ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent };
  if (type === "image") return <div className="asset-preview image-preview" style={style} />;
  if (type === "audio") {
    return (
      <div className="asset-preview audio-preview" style={style}>
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ height: `${35 + ((index * 13) % 45)}%` }} />
        ))}
      </div>
    );
  }
  if (type === "model") return <div className="asset-preview model-preview" style={style} />;
  return <div className="asset-preview video-preview" style={style} />;
}

export default async function AssetsPage({ params, searchParams }: AssetsPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const typeFilter = getSearchParamValue(queryParams.type) ?? "all";
  const assets = listAssets(typeFilter);
  const base = `/${org}/${repo}/assets`;

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
          <h1>Asset browser</h1>
          <p className="muted" style={{ margin: 0 }}>Binary-first browsing across textures, audio, models, and video — with dedup-aware metadata.</p>
        </div>
        <Link className="button-secondary" href={`/${org}/${repo}/analytics`}>Storage analytics</Link>
      </div>

      <div className="meta-row">
        {TYPES.map((type) => (
          <Link
            key={type}
            href={type === "all" ? base : `${base}?type=${type}`}
            className={`pill ${typeFilter === type ? "" : "muted-pill"}`}
            style={typeFilter === type ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand)" } : {}}
          >
            {type === "all" ? "All assets" : type}
          </Link>
        ))}
      </div>

      <section className="asset-grid">
        {assets.map((asset) => {
          const dedup = Math.round((asset.sharedChunkCount / asset.chunkCount) * 100);
          return (
            <article key={asset.id} className="panel asset-card" style={{ padding: 0, overflow: "hidden" }}>
              <Link href={`/${org}/${repo}/assets/${asset.id}`} style={{ display: "block" }}>
                <AssetPreview type={asset.type} accent={asset.preview.accent} secondaryAccent={asset.preview.secondaryAccent} />
              </Link>
              <div style={{ padding: "0.85rem 1rem" }}>
                <div className="meta-row" style={{ marginBottom: "0.4rem" }}>
                  <span className="pill">{asset.type}</span>
                  <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "auto" }}>{formatBytes(asset.sizeBytes)}</span>
                </div>
                <h2 style={{ marginTop: 0, fontSize: "1rem" }}>
                  <Link href={`/${org}/${repo}/assets/${asset.id}`}>{asset.name}</Link>
                </h2>
                <p className="muted" style={{ fontSize: "0.85rem" }}>{asset.preview.caption}</p>
                <div className="list-row-meta" style={{ marginTop: 0 }}>
                  <code style={{ fontSize: "0.75rem" }}>{asset.path}</code>
                </div>
                <div className="meta-row" style={{ marginTop: "0.6rem", justifyContent: "space-between" }}>
                  <span className="highlight-cell" style={{ fontSize: "0.82rem" }}>{dedup}% chunks shared</span>
                  <Link className="inline-link" href={`/${org}/${repo}/binary-diff/${asset.id}`} style={{ fontSize: "0.82rem" }}>View diff →</Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
