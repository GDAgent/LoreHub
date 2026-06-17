import Link from "next/link";

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
          summary: `Created from revision ${baseRevisionDetails.shortHash} through the Phase 1 branch flow.`,
          isNew: true,
        }
      : null;

  const branches = createdBranch ? [createdBranch, ...demoBranches] : demoBranches;

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>Branches</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/revisions`}>
              View revisions
            </Link>
          </div>
          <div className="revision-list">
            {branches.map((branch) => {
              const head = getRevision(branch.head);

              return (
                <article key={branch.name} className="revision-card">
                  <div className="meta-row">
                    <span className="pill">{branch.name}</span>
                    {branch.isDefault ? <span className="pill muted-pill">default</span> : null}
                    {branch.isNew ? <span className="pill success-pill">created</span> : null}
                  </div>
                  <h2>{head?.title ?? branch.head}</h2>
                  <p className="muted">{branch.summary}</p>
                  <div className="meta-row muted">
                    <span>Head {head?.shortHash ?? branch.head.slice(0, 7)}</span>
                    <span>{branch.updatedAt}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Create branch</h2>
          <p className="muted">
            The form creates a new branch view from a selected base revision so the Phase 1 UI supports both listing and creation flows.
          </p>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="branch-name">Branch name</label>
              <input
                id="branch-name"
                name="branchName"
                defaultValue={normalizedBranchName}
                placeholder="feature/mission-fail-state"
                type="text"
              />
            </div>
            <div className="field">
              <label htmlFor="base-revision">Base revision</label>
              <input
                id="base-revision"
                name="baseRevision"
                defaultValue={normalizedBaseRevision}
                placeholder="f34ab29ce810"
                type="text"
              />
            </div>
            <button className="button" type="submit">
              Create branch
            </button>
          </form>
          {createdBranch ? (
            <p className="success-text">Created branch `{createdBranch.name}` at {createdBranch.head.slice(0, 7)}.</p>
          ) : null}
          {branchError ? <p className="error-text">{branchError}</p> : null}
        </article>
      </section>
    </main>
  );
}
