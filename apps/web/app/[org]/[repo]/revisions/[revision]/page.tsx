import Link from "next/link";
import { notFound } from "next/navigation";

import { getDiff, getRevision, getRevisionTreeLink } from "@/lib/demo-repository";

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
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>{currentRevision.title}</h1>
          </div>
          <span className="pill">{currentRevision.shortHash}</span>
        </div>
        <p className="muted">{currentRevision.description}</p>
        <div className="meta-row muted">
          <span>{currentRevision.author}</span>
          <span>{currentRevision.authoredAt.replace("T", " ").replace("Z", " UTC")}</span>
          <span>
            {currentRevision.filesChanged} files changed, +{currentRevision.insertions} / -{currentRevision.deletions}
          </span>
        </div>
        <div className="cta-row compact">
          <Link className="button-secondary" href={`/${org}/${repo}/${getRevisionTreeLink(currentRevision.hash)}`}>
            Browse snapshot
          </Link>
          {primaryParent ? (
            <Link className="button-secondary" href={`/${org}/${repo}/diff/${primaryParent}/${currentRevision.hash}`}>
              Open diff
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Parents</h2>
          <ul className="list">
            {currentRevision.parents.length ? (
              currentRevision.parents.map((parentHash) => <li key={parentHash}>{parentHash}</li>)
            ) : (
              <li>Root revision</li>
            )}
          </ul>
        </article>

        <article className="panel">
          <h2>Change summary</h2>
          {diff ? (
            <ul className="list">
              {diff.files.map((file) => (
                <li key={file.path}>{file.path} — {file.summary}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">No parent diff available for the bootstrap revision.</p>
          )}
        </article>
      </section>
    </main>
  );
}
