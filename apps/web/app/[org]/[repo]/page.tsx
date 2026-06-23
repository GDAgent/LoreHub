import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { RichText } from "@/lib/render-rich-text";
import {
  demoBranches,
  demoRevisions,
  formatBytes,
  getDemoNode,
  listTreeEntries,
} from "@/lib/demo-repository";

type RepositoryPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { org, repo } = await params;
  const head = demoRevisions[0];
  const entries = listTreeEntries(head.hash, "");
  const readmeNode = getDemoNode(head.hash, "README.md");
  const readme = readmeNode?.kind === "text" ? readmeNode.content : null;
  const defaultBranch = demoBranches.find((branch) => branch.isDefault) ?? demoBranches[0];

  return (
    <main className="shell page">
      <section>
        <div className="repo-title">
          <div>
            <div className="repo-path">
              <Link href={`/${org}`}>{org}</Link> / <strong>{repo}</strong>{" "}
              <span className="pill">Public</span>
            </div>
            <p className="muted top-gap-sm" style={{ maxWidth: "70ch" }}>
              Binary-first sample project for validating revision browsing, asset review, change
              requests, and CI on top of Lore.
            </p>
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
            <div className="meta-row" style={{ justifyContent: "space-between", padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-muted)" }}>
              <span className="meta-row">
                <span className="avatar-button" style={{ width: 24, height: 24, fontSize: "0.7rem" }} aria-hidden="true">M</span>
                <strong>{head.author}</strong>
                <span className="muted">{head.title}</span>
              </span>
              <Link className="muted" href={`/${org}/${repo}/revisions/${head.hash}`} style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem" }}>
                {head.shortHash}
              </Link>
            </div>
            <div className="entry-table" style={{ border: "none", borderRadius: 0 }}>
              {entries.map((entry) => (
                <div key={entry.path} className="entry-row">
                  <span className="entry-name">
                    <Link href={
                      entry.kind === "directory"
                        ? `/${org}/${repo}/tree/${head.hash}/${entry.path}`
                        : `/${org}/${repo}/tree/${head.hash}/${entry.path}`
                    }>
                      {entry.kind === "directory" ? "📁 " : entry.kind === "binary" ? "📦 " : "📄 "}
                      {entry.name}
                    </Link>
                  </span>
                  <span className="entry-kind">{entry.kind}</span>
                  <span className="entry-meta">{entry.size ? formatBytes(entry.size) : "—"}</span>
                </div>
              ))}
            </div>
          </div>

          {readme ? (
            <div className="panel">
              <div className="meta-row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <strong>README.md</strong>
              </div>
              <div className="section-divider" />
              <RichText org={org} repo={repo} text={readme} />
            </div>
          ) : null}
        </div>

        <aside style={{ display: "grid", gap: "1rem" }}>
          <div className="panel">
            <h3>About</h3>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Binary-first sample repository on Lore. Browse code, review assets, and run pipelines.
            </p>
            <div className="metadata-list top-gap-sm">
              <div className="metadata-row">
                <span className="muted">Default branch</span>
                <span className="pill">{defaultBranch.name}</span>
              </div>
              <div className="metadata-row">
                <span className="muted">Branches</span>
                <Link href={`/${org}/${repo}/branches`}>{demoBranches.length}</Link>
              </div>
              <div className="metadata-row">
                <span className="muted">Revisions</span>
                <Link href={`/${org}/${repo}/revisions`}>{demoRevisions.length}</Link>
              </div>
            </div>
          </div>

          <div className="panel">
            <h3>Storage</h3>
            <p className="muted" style={{ fontSize: "0.9rem", marginTop: 0 }}>
              Lore deduplicates fragments across revisions and repositories.
            </p>
            <div className="stat top-gap-sm">
              <strong className="highlight-cell">62% saved</strong>
              <span className="muted">3.6 GB logical → 1.4 GB stored</span>
            </div>
            <Link className="button-secondary top-gap-sm" href={`/${org}/${repo}/analytics`} style={{ width: "100%" }}>
              View analytics
            </Link>
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
