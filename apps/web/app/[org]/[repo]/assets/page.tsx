import Link from "next/link";

import { listAssets } from "@/lib/demo-assets";
import { getSearchParamValue } from "@/lib/search-params";

type AssetsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AssetPreview({ type, accent, secondaryAccent }: { type: string; accent: string; secondaryAccent: string }) {
  if (type === "image") {
    return <div className="asset-preview image-preview" style={{ ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent }} />;
  }

  if (type === "audio") {
    return (
      <div className="asset-preview audio-preview" style={{ ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent }}>
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ height: `${35 + ((index * 13) % 45)}%` }} />
        ))}
      </div>
    );
  }

  if (type === "model") {
    return <div className="asset-preview model-preview" style={{ ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent }} />;
  }

  return <div className="asset-preview video-preview" style={{ ["--asset-accent" as string]: accent, ["--asset-secondary" as string]: secondaryAccent }} />;
}

export default async function AssetsPage({ params, searchParams }: AssetsPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const typeFilter = getSearchParamValue(queryParams.type) ?? "all";
  const assets = listAssets(typeFilter);

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>Asset browser</h1>
          </div>
          <Link className="button-secondary" href={`/${org}/${repo}/analytics`}>
            Storage analytics
          </Link>
        </div>
        <p className="muted">
          Phase 3 adds binary-first browsing across image, audio, model, and video assets with preview cards and metadata entry points.
        </p>
        <form className="toolbar-grid compact-toolbar" method="get">
          <input defaultValue={typeFilter === "all" ? "" : typeFilter} name="type" placeholder="image, audio, model, video" type="text" />
          <button className="button-secondary" type="submit">
            Filter
          </button>
        </form>
      </section>

      <section className="asset-grid top-gap">
        {assets.map((asset) => (
          <article key={asset.id} className="panel asset-card">
            <AssetPreview type={asset.type} accent={asset.preview.accent} secondaryAccent={asset.preview.secondaryAccent} />
            <div className="meta-row top-gap-sm">
              <span className="pill">{asset.type}</span>
              <span className="pill muted-pill">{asset.mimeType}</span>
            </div>
            <h2>{asset.name}</h2>
            <p className="muted">{asset.preview.caption}</p>
            <div className="meta-row muted">
              <span>{asset.path}</span>
            </div>
            <div className="cta-row compact">
              <Link className="button-secondary" href={`/${org}/${repo}/assets/${asset.id}`}>
                View metadata
              </Link>
              <Link className="button-secondary" href={`/${org}/${repo}/binary-diff/${asset.id}`}>
                View diff
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
