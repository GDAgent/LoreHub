import Link from "next/link";
import { notFound } from "next/navigation";

import { getAsset } from "@/lib/demo-assets";

type AssetDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    assetId: string;
  }>;
};

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { org, repo, assetId } = await params;
  const asset = getAsset(assetId);

  if (!asset) {
    notFound();
  }

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>{asset.name}</h1>
          </div>
          <span className="pill">{asset.type}</span>
        </div>
        <p className="muted">{asset.description}</p>
        <div className="meta-row muted">
          <span>{asset.path}</span>
          <span>{asset.mimeType}</span>
          <span>{asset.chunkCount} chunks</span>
        </div>
        <div className="cta-row compact">
          <Link className="button-secondary" href={`/${org}/${repo}/binary-diff/${asset.id}`}>
            Open binary diff
          </Link>
          <Link className="button-secondary" href={`/${org}/${repo}/locks?lockPath=${encodeURIComponent(asset.path)}&action=lock`}>
            Lock asset
          </Link>
        </div>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Metadata</h2>
          <div className="metadata-list top-gap-sm">
            {Object.entries(asset.metadata).map(([key, value]) => (
              <div key={key} className="metadata-row">
                <span className="muted">{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="panel">
          <h2>Chunk profile</h2>
          <ul className="list">
            <li>{asset.chunkCount} total chunks in the current revision</li>
            <li>{asset.sharedChunkCount} chunks reused from existing repository content</li>
            <li>Head revision: `{asset.headRevision}`</li>
            <li>Previous revision: `{asset.previousRevision}`</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
