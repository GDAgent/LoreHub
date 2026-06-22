import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { getDiff, getRevision, getRevisionTreeLink } from "@/lib/demo-repository";
import { formatDateTime } from "@/lib/format";

type RevisionDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    revision: string;
  }>;
};

export default async function RevisionDetailPage({ params }: RevisionDetailPageProps) {
  const { org, repo, revision } = await params;
  const currentRevision = getRevision(revision);

  if (!currentRevision) {
    notFound();
  }

  const primaryParent = currentRevision.parents[0];
  const diff = primaryParent ? getDiff(primaryParent, currentRevision.hash) : undefined;

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
          <h1 style={{ margin: 0 }}>{currentRevision.title}</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>{currentRevision.description}</p>
        </div>
        <code className="pill muted-pill">{currentRevision.shortHash}</code>
      </div>

      <div className="list-row-meta" style={{ marginTop: 0 }}>
        <span>{currentRevision.author}</span>
        <span>· {formatDateTime(currentRevision.authoredAt)}</span>
        <span>· {currentRevision.filesChanged} files changed</span>
        <span style={{ color: "var(--success)" }}>+{currentRevision.insertions}</span>
        <span style={{ color: "var(--danger)" }}>−{currentRevision.deletions}</span>
      </div>

      <div className="meta-row">
        <Link className="button" href={`/${org}/${repo}/${getRevisionTreeLink(currentRevision.hash)}`}>Browse snapshot</Link>
        {primaryParent ? (
          <Link className="button-secondary" href={`/${org}/${repo}/diff/${primaryParent}/${currentRevision.hash}`}>Open diff</Link>
        ) : null}
      </div>

      <div className="detail-grid">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Changed files</h2>
          {diff ? (
            <table className="table">
              <tbody>
                {diff.files.map((file) => (
                  <tr key={file.path}>
                    <td>
                      <Link href={`/${org}/${repo}/diff/${primaryParent}/${currentRevision.hash}`} style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>{file.path}</Link>
                    </td>
                    <td className="muted" style={{ fontSize: "0.85rem" }}>{file.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">No parent diff available for the bootstrap revision.</p>
          )}
        </article>

        <aside className="panel">
          <h3 style={{ marginTop: 0 }}>Details</h3>
          <div className="metadata-list">
            <div className="metadata-row"><span className="muted">Commit</span><code style={{ fontSize: "0.78rem" }}>{currentRevision.hash}</code></div>
            <div className="metadata-row"><span className="muted">Author</span><strong>{currentRevision.author}</strong></div>
            <div className="metadata-row"><span className="muted">Authored</span><strong style={{ fontSize: "0.9rem" }}>{formatDateTime(currentRevision.authoredAt)}</strong></div>
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
      </div>
    </main>
  );
}
