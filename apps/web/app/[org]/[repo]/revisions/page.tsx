import Link from "next/link";

import { demoDag, demoRevisions, getRevisionTreeLink } from "@/lib/demo-repository";
import { getDagLinks } from "@/lib/dag";

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
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>Revisions</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/branches`}>
              View branches
            </Link>
          </div>
          <div className="revision-list">
            {demoRevisions.map((revision) => (
              <article key={revision.hash} className="revision-card">
                <div className="meta-row">
                  <span className="pill">{revision.shortHash}</span>
                  {revision.branchTags.map((tag) => (
                    <span key={tag} className="pill muted-pill">
                      {tag}
                    </span>
                  ))}
                </div>
                <h2>{revision.title}</h2>
                <p className="muted">{revision.description}</p>
                <div className="meta-row muted">
                  <span>{revision.author}</span>
                  <span>{revision.authoredAt.replace("T", " ").replace("Z", " UTC")}</span>
                  <span>
                    {revision.filesChanged} files changed, +{revision.insertions} / -{revision.deletions}
                  </span>
                </div>
                <div className="cta-row compact">
                  <Link className="button-secondary" href={`/${org}/${repo}/revisions/${revision.hash}`}>
                    Revision detail
                  </Link>
                  <Link className="button-secondary" href={`/${org}/${repo}/${getRevisionTreeLink(revision.hash)}`}>
                    Browse tree
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Revision DAG</h2>
          <p className="muted">
            A visual commit graph helps reviewers understand merges and branch-specific work at a glance.
          </p>
          <svg className="dag-canvas" viewBox="0 0 340 280" role="img" aria-label="Revision DAG">
            {dagLinks.map((link) =>
              link.path ? <path key={link.id} d={link.path} className="dag-line" /> : null,
            )}
            {demoDag.map((node) => (
              <g key={node.hash}>
                <circle cx={node.x} cy={node.y} r="12" className="dag-node" />
                <text x={node.x + 18} y={node.y + 5} className="dag-label">
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </article>
      </section>
    </main>
  );
}
