import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { type DemoBranch, demoBranches, getRevision } from "@/lib/demo-repository";

type BranchesPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<{
    branchName?: string;
    baseRevision?: string;
  }>;
};

export default async function BranchesPage({ params, searchParams }: BranchesPageProps) {
  const { org, repo } = await params;
  const { branchName, baseRevision } = await searchParams;
  const normalizedBranchName = branchName?.trim();
  const normalizedBaseRevision = baseRevision?.trim();
  const baseRevisionDetails = normalizedBaseRevision ? getRevision(normalizedBaseRevision) : undefined;
  const branchError =
    normalizedBranchName && !baseRevisionDetails
      ? "Choose a valid base revision from the current repository history."
      : undefined;

  const createdBranch: DemoBranch | null =
    normalizedBranchName && baseRevisionDetails && !demoBranches.some((branch) => branch.name === normalizedBranchName)
      ? {
          name: normalizedBranchName,
          head: baseRevisionDetails.hash,
          updatedAt: "just now",
          summary: `Created from revision ${baseRevisionDetails.shortHash}.`,
          isNew: true,
        }
      : null;

  const branches = createdBranch ? [createdBranch, ...demoBranches] : demoBranches;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="branches" />
      </section>

      {createdBranch ? <p className="success-text">✓ Created branch {createdBranch.name} at {createdBranch.head.slice(0, 7)}.</p> : null}
      {branchError ? <p className="error-text">{branchError}</p> : null}

      <div className="meta-row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Branches</h1>
        <details>
          <summary className="button" style={{ listStyle: "none" }}>New branch</summary>
          <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(420px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
            <h3>Create branch</h3>
            <form className="form-grid" method="get">
              <div className="field">
                <label htmlFor="branch-name">Branch name</label>
                <input id="branch-name" name="branchName" defaultValue={normalizedBranchName} placeholder="feature/mission-fail-state" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="base-revision">Base revision</label>
                <input id="base-revision" name="baseRevision" defaultValue={normalizedBaseRevision} placeholder="f34ab29ce810" type="text" required />
              </div>
              <button className="button" type="submit">Create branch</button>
            </form>
          </div>
        </details>
      </div>

      <div className="list-rows">
        {branches.map((branch) => {
          const head = getRevision(branch.head);
          return (
            <div key={branch.name} className="list-row">
              <span className="list-row-icon state-open"><BranchIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/${repo}/tree/${branch.head}`} style={{ fontFamily: "var(--font-mono)" }}>{branch.name}</Link>
                  {branch.isDefault ? <span className="pill muted-pill" style={{ marginLeft: "0.5rem" }}>default</span> : null}
                  {branch.isNew ? <span className="pill success-pill" style={{ marginLeft: "0.5rem" }}>new</span> : null}
                </div>
                <div className="list-row-meta">
                  <span>{head?.title ?? branch.head}</span>
                  <span>· head <code style={{ fontSize: "0.8em" }}>{head?.shortHash ?? branch.head.slice(0, 7)}</code></span>
                  <span>· updated {branch.updatedAt}</span>
                </div>
              </div>
              <div className="meta-row">
                <Link className="button-secondary" href={`/${org}/${repo}/cr?sourceBranch=${branch.name}`}>New CR</Link>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function BranchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 9v6M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
