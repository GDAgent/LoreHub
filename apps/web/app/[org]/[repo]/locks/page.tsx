import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime } from "@/lib/format";
import { getLocks } from "@/lib/repo-data";

type LocksPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function LocksPage({ params }: LocksPageProps) {
  const { org, repo } = await params;
  const locks = await getLocks(org, repo);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="locks" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>File locks</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Exclusive and review locks prevent conflicting edits to large binary assets.</p>
        </div>
      </div>

      {locks.length ? (
        <div className="list-rows">
          {locks.map((lock) => (
            <div key={lock.path} className="list-row">
              <span className="list-row-icon state-open"><LockIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <code style={{ fontSize: "0.85em" }}>{lock.path}</code>
                  <span className={`pill ${lock.lockType === "exclusive" ? "" : "muted-pill"}`} style={{ marginLeft: "0.5rem" }}>{lock.lockType}</span>
                </div>
                {lock.note ? <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{lock.note}</p> : null}
                <div className="list-row-meta">
                  <span>{lock.owner}</span>
                  <span>· locked {formatDateTime(lock.acquiredAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No active locks</h3>
          <p className="muted">Lock a binary asset to signal you are editing it and prevent overwrite conflicts.</p>
        </div>
      )}
    </main>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
