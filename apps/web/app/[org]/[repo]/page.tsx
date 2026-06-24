import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { formatBytes } from "@/lib/format";
import { getBranches, getRevisions, getTree } from "@/lib/repo-data";
import { getRepoSettings } from "@/lib/repo-settings-data";

type RepositoryPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { org, repo } = await params;

  const [settings, branches, revisions] = await Promise.all([
    getRepoSettings(org, repo),
    getBranches(org, repo),
    getRevisions(org, repo),
  ]);

  const defaultBranch =
    branches.find((branch) => branch.isDefault) ?? branches[0] ?? null;
  const head = revisions[0] ?? null;
  const entries = head ? await getTree(org, repo, head.hash, "") : [];
  const visibility = settings?.visibility ?? "private";

  return (
    <main className="shell page">
      <section>
        <div className="repo-title">
          <div>
            <div className="repo-path">
              <Link href={`/${org}`}>{org}</Link> / <strong>{repo}</strong>{" "}
              <span className="pill">
                {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
              </span>
            </div>
            {settings?.description ? (
              <p className="muted top-gap-sm" style={{ maxWidth: "70ch" }}>
                {settings.description}
              </p>
            ) : null}
          </div>
          <div className="meta-row">
            <button className="button-secondary" type="button">★ Star</button>
            <button className="button-secondary" type="button">Watch</button>
            <Link className="button" href={`/${org}/${repo}/push`}>Clone / Push</Link>
          </div>
        </div>
        <RepoTabs org={org} repo={repo} active="code" />
      </section>

      <div className="repo-home-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <div className="panel" style={{ padding: 0 }}>
            {head ? (
              <div className="meta-row" style={{ justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-muted)" }}>
                <span className="meta-row">
                  <strong>{head.author || "unknown"}</strong>
                  <span className="muted">{head.message}</span>
                </span>
                <Link className="muted" href={`/${org}/${repo}/revisions/${head.hash}`} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                  {head.shortHash}
                </Link>
              </div>
            ) : null}
            {entries.length > 0 ? (
              <div className="entry-table" style={{ border: "none", borderRadius: 0 }}>
                {entries.map((entry) => (
                  <div key={entry.path} className="entry-row">
                    <span className="entry-name">
                      <Link href={`/${org}/${repo}/tree/${head?.hash}/${entry.path}`}>
                        {entry.kind === "directory" ? "📁 " : "📄 "}
                        {entry.name}
                      </Link>
                    </span>
                    <span className="entry-kind">{entry.kind}</span>
                    <span className="entry-meta">{entry.size ? formatBytes(entry.size) : "—"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <p className="muted" style={{ margin: 0 }}>
                  No content pushed yet. Push a revision with the Lore client to
                  populate this repository.
                </p>
                <Link className="button-secondary top-gap-sm" href={`/${org}/${repo}/push`}>
                  Clone / Push instructions
                </Link>
              </div>
            )}
          </div>
        </div>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <div className="panel">
            <h3>About</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Binary-first repository on Lore. Browse code, review assets, and run pipelines.
            </p>
            <div className="metadata-list top-gap-sm">
              <div className="metadata-row">
                <span className="muted">Default branch</span>
                <span className="pill">{defaultBranch?.name ?? settings?.defaultBranch ?? "—"}</span>
              </div>
              <div className="metadata-row">
                <span className="muted">Branches</span>
                <Link href={`/${org}/${repo}/branches`}>{branches.length}</Link>
              </div>
              <div className="metadata-row">
                <span className="muted">Revisions</span>
                <Link href={`/${org}/${repo}/revisions`}>{revisions.length}</Link>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>Activity</h3>
            <div className="stack-links top-gap-sm">
              <Link href={`/${org}/${repo}/issues`}>Open issues</Link>
              <Link href={`/${org}/${repo}/cr`}>Change requests</Link>
              <Link href={`/${org}/${repo}/pipelines`}>Recent pipelines</Link>
              <Link href={`/${org}/${repo}/assets`}>Asset browser</Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
