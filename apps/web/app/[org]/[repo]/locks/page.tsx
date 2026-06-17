import Link from "next/link";

import { buildLockView } from "@/lib/demo-assets";
import { getUser } from "@/lib/demo-collaboration";
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
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>File locks</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/assets`}>
              Asset browser
            </Link>
          </div>
          <div className="comment-thread top-gap-sm">
            {locks.map((lock) => (
              <article key={lock.path} className="comment-card">
                <div className="section-header">
                  <div>
                    <div className="meta-row">
                      <span className="pill">{lock.lockType}</span>
                      <span className="pill muted-pill">{lock.path}</span>
                    </div>
                    <p>{lock.note}</p>
                  </div>
                  <Link className="button-secondary" href={`/${org}/${repo}/locks?action=unlock&lockPath=${encodeURIComponent(lock.path)}`}>
                    Unlock
                  </Link>
                </div>
                <div className="meta-row muted">
                  <span>{getUser(lock.owner)?.name ?? lock.owner}</span>
                  <span>{lock.acquiredAt.replace("T", " ").replace("Z", " UTC")}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Create lock</h2>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="lockPath">Asset path</label>
              <input id="lockPath" name="lockPath" placeholder="Content/Textures/T_HeroCorridor_Albedo.png" type="text" />
            </div>
            <input name="action" type="hidden" value="lock" />
            <button className="button" type="submit">
              Lock asset
            </button>
          </form>
          {action === "lock" && lockPath ? <p className="success-text">Locked {lockPath}.</p> : null}
          {action === "unlock" && lockPath ? <p className="success-text">Unlocked {lockPath}.</p> : null}
        </article>
      </section>
    </main>
  );
}
