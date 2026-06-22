import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { buildLockView } from "@/lib/demo-assets";
import { getUser } from "@/lib/demo-collaboration";
import { formatDateTime } from "@/lib/format";
import { getSearchParamValue } from "@/lib/search-params";

type LocksPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LocksPage({ params, searchParams }: LocksPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const action = getSearchParamValue(queryParams.action);
  const lockPath = getSearchParamValue(queryParams.lockPath);
  const locks = buildLockView(action, lockPath);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="locks" />
      </section>

      {action === "lock" && lockPath ? <p className="success-text">✓ Locked {lockPath}.</p> : null}
      {action === "unlock" && lockPath ? <p className="success-text">✓ Unlocked {lockPath}.</p> : null}

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>File locks</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Exclusive and review locks prevent conflicting edits to large binary assets.</p>
        </div>
        <details>
          <summary className="button" style={{ listStyle: "none" }}>Lock a file</summary>
          <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(440px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
            <h3 style={{ marginTop: 0 }}>Create lock</h3>
            <form className="form-grid" method="get">
              <div className="field">
                <label htmlFor="lockPath">Asset path</label>
                <input id="lockPath" name="lockPath" placeholder="Content/Textures/T_HeroCorridor_Albedo.png" type="text" required />
              </div>
              <input name="action" type="hidden" value="lock" />
              <button className="button" type="submit">Lock asset</button>
            </form>
          </div>
        </details>
      </div>

      {locks.length ? (
        <div className="list-rows">
          {locks.map((lock) => {
            const owner = getUser(lock.owner);
            return (
              <div key={lock.path} className="list-row">
                <span className="list-row-icon state-open"><LockIcon /></span>
                <div className="list-row-main">
                  <div className="list-row-title">
                    <code style={{ fontSize: "0.85em" }}>{lock.path}</code>
                    <span className={`pill ${lock.lockType === "exclusive" ? "" : "muted-pill"}`} style={{ marginLeft: "0.5rem" }}>{lock.lockType}</span>
                  </div>
                  <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{lock.note}</p>
                  <div className="list-row-meta">
                    <span>{owner?.name ?? lock.owner}</span>
                    <span>· locked {formatDateTime(lock.acquiredAt)}</span>
                  </div>
                </div>
                <div className="meta-row">
                  <Link className="button-secondary" href={`/${org}/${repo}/locks?action=unlock&lockPath=${encodeURIComponent(lock.path)}`}>Unlock</Link>
                </div>
              </div>
            );
          })}
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
