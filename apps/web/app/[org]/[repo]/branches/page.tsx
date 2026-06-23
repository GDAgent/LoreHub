import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDate } from "@/lib/format";
import { getBranches } from "@/lib/repo-data";

type BranchesPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function BranchesPage({ params }: BranchesPageProps) {
  const { org, repo } = await params;
  const branches = await getBranches(org, repo);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="branches" />
      </section>

      <div className="meta-row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Branches</h1>
      </div>

      {branches.length === 0 ? (
        <div className="list-rows"><div className="empty-state" style={{ border: "none" }}>No branches yet.</div></div>
      ) : (
        <div className="list-rows">
          {branches.map((branch) => (
            <div key={branch.name} className="list-row">
              <span className="list-row-icon state-open"><BranchIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/${repo}/tree/${branch.headRevision}`} style={{ fontFamily: "var(--font-mono)" }}>{branch.name}</Link>
                  {branch.isDefault ? <span className="pill muted-pill" style={{ marginLeft: "0.5rem" }}>default</span> : null}
                </div>
                <div className="list-row-meta">
                  <span>head <code style={{ fontSize: "0.8em" }}>{branch.headRevision.slice(0, 7)}</code></span>
                  <span>· updated {formatDate(branch.updatedAt)}</span>
                </div>
              </div>
              <div className="meta-row">
                <Link className="button-secondary" href={`/${org}/${repo}/cr?sourceBranch=${branch.name}`}>New CR</Link>
              </div>
            </div>
          ))}
        </div>
      )}
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
