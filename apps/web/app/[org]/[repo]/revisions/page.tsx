import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime } from "@/lib/format";
import { getRevisions } from "@/lib/repo-data";

type RevisionsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function RevisionsPage({ params }: RevisionsPageProps) {
  const { org, repo } = await params;
  const revisions = await getRevisions(org, repo);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="revisions" />
      </section>

      <h1 style={{ margin: 0 }}>Revisions</h1>

      {revisions.length > 0 ? (
        <div className="list-rows">
          {revisions.map((revision) => (
            <div key={revision.hash} className="list-row">
              <span className="list-row-icon state-open"><CommitIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/${repo}/revisions/${revision.hash}`}>
                    {revision.message || revision.shortHash}
                  </Link>
                </div>
                <div className="list-row-meta">
                  <code style={{ fontSize: "0.8em" }}>{revision.shortHash}</code>
                  {revision.author ? <span>· {revision.author}</span> : null}
                  {revision.authoredAt ? <span>· {formatDateTime(revision.authoredAt)}</span> : null}
                </div>
              </div>
              <div className="meta-row">
                <Link className="button-secondary" href={`/${org}/${repo}/tree/${revision.hash}`}>Browse</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="panel empty-state">
          <p className="muted" style={{ margin: 0 }}>
            No revisions yet. Push a revision with the Lore client to see history here.
          </p>
        </div>
      )}
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
