import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime } from "@/lib/format";
import { getRevision } from "@/lib/repo-data";

type RevisionDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    revision: string;
  }>;
};

export default async function RevisionDetailPage({ params }: RevisionDetailPageProps) {
  const { org, repo, revision } = await params;
  const currentRevision = await getRevision(org, repo, revision);

  if (!currentRevision) {
    notFound();
  }

  const primaryParent = currentRevision.parents[0];

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="revisions" />
      </section>

      <div className="section-header">
        <div>
          <div className="meta-row" style={{ marginBottom: "0.35rem" }}>
            <Link className="inline-link" href={`/${org}/${repo}/revisions`}>← Revisions</Link>
          </div>
          <h1 style={{ margin: 0 }}>{currentRevision.message || currentRevision.shortHash}</h1>
        </div>
        <code className="pill muted-pill">{currentRevision.shortHash}</code>
      </div>

      <div className="list-row-meta" style={{ marginTop: 0 }}>
        {currentRevision.author ? <span>{currentRevision.author}</span> : null}
        {currentRevision.authoredAt ? <span>· {formatDateTime(currentRevision.authoredAt)}</span> : null}
      </div>

      <div className="meta-row">
        <Link className="button" href={`/${org}/${repo}/tree/${currentRevision.hash}`}>Browse snapshot</Link>
        {primaryParent ? (
          <Link className="button-secondary" href={`/${org}/${repo}/diff/${primaryParent}/${currentRevision.hash}`}>Open diff</Link>
        ) : null}
      </div>

      <aside className="panel">
        <h3 style={{ marginTop: 0 }}>Details</h3>
        <div className="metadata-list">
          <div className="metadata-row"><span className="muted">Revision</span><code style={{ fontSize: "0.78rem" }}>{currentRevision.hash}</code></div>
          {currentRevision.author ? (
            <div className="metadata-row"><span className="muted">Author</span><strong>{currentRevision.author}</strong></div>
          ) : null}
          {currentRevision.authoredAt ? (
            <div className="metadata-row"><span className="muted">Authored</span><strong style={{ fontSize: "0.9rem" }}>{formatDateTime(currentRevision.authoredAt)}</strong></div>
          ) : null}
        </div>
        <h3>Parents</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {currentRevision.parents.length ? (
            currentRevision.parents.map((parentHash) => (
              <Link key={parentHash} className="button-secondary" href={`/${org}/${repo}/revisions/${parentHash}`} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                {parentHash.slice(0, 12)}
              </Link>
            ))
          ) : (
            <span className="muted">Root revision</span>
          )}
        </div>
      </aside>
    </main>
  );
}
