import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { demoDag, demoRevisions, getRevisionTreeLink } from "@/lib/demo-repository";
import { getDagLinks } from "@/lib/dag";
import { formatDateTime } from "@/lib/format";

type RevisionsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function RevisionsPage({ params }: RevisionsPageProps) {
  const { org, repo } = await params;
  const dagLinks = getDagLinks();

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="revisions" />
      </section>

      <h1 style={{ margin: 0 }}>Revisions</h1>

      <div className="detail-grid">
        <div className="list-rows">
          {demoRevisions.map((revision) => (
            <div key={revision.hash} className="list-row">
              <span className="list-row-icon state-open"><CommitIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/${repo}/revisions/${revision.hash}`}>{revision.title}</Link>
                  {revision.branchTags.map((tag) => (
                    <span key={tag} className="pill muted-pill" style={{ marginLeft: "0.4rem" }}>{tag}</span>
                  ))}
                </div>
                <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{revision.description}</p>
                <div className="list-row-meta">
                  <code style={{ fontSize: "0.8em" }}>{revision.shortHash}</code>
                  <span>· {revision.author}</span>
                  <span>· {formatDateTime(revision.authoredAt)}</span>
                  <span>· {revision.filesChanged} files</span>
                  <span style={{ color: "var(--success)" }}>+{revision.insertions}</span>
                  <span style={{ color: "var(--danger)" }}>−{revision.deletions}</span>
                </div>
              </div>
              <div className="meta-row">
                <Link className="button-secondary" href={`/${org}/${repo}/${getRevisionTreeLink(revision.hash)}`}>Browse</Link>
              </div>
            </div>
          ))}
        </div>

        <aside className="panel" style={{ position: "sticky", top: "calc(var(--header-h) + 1rem)" }}>
          <h3>Revision graph</h3>
          <p className="muted" style={{ fontSize: "0.85rem", marginTop: 0 }}>Branches, merges, and tags at a glance.</p>
          <svg className="dag-canvas" viewBox="0 0 340 280" role="img" aria-label="Revision DAG">
            {dagLinks.map((link) => (link.path ? <path key={link.id} d={link.path} className="dag-line" /> : null))}
            {demoDag.map((node) => (
              <g key={node.hash}>
                <circle cx={node.x} cy={node.y} r="10" className="dag-node" />
                <text x={node.x + 16} y={node.y + 4} className="dag-label">{node.label}</text>
              </g>
            ))}
          </svg>
        </aside>
      </div>
    </main>
  );
}

function CommitIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M2 12h6M16 12h6" />
    </svg>
  );
}
