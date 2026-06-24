import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { getRevision } from "@/lib/repo-data";

type DiffPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    base: string;
    head: string;
  }>;
};

export default async function DiffPage({ params }: DiffPageProps) {
  const { org, repo, base, head } = await params;
  const [baseRevision, headRevision] = await Promise.all([
    getRevision(org, repo, base),
    getRevision(org, repo, head),
  ]);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="code" />
      </section>

      <header>
        <h1 style={{ marginBottom: "0.5rem" }}>Comparing changes</h1>
        <div className="meta-row muted">
          <span className="pill" style={{ fontFamily: "var(--font-mono)" }}>
            {baseRevision?.shortHash ?? base.slice(0, 7)} … {headRevision?.shortHash ?? head.slice(0, 7)}
          </span>
        </div>
      </header>

      <section className="panel empty-state">
        <p className="muted" style={{ margin: 0 }}>
          File-level diffs aren&apos;t served over the read API yet. Browse each
          revision&apos;s snapshot to compare contents:
        </p>
        <div className="meta-row top-gap-sm">
          <Link className="button-secondary" href={`/${org}/${repo}/tree/${base}`}>Browse {base.slice(0, 7)}</Link>
          <Link className="button-secondary" href={`/${org}/${repo}/tree/${head}`}>Browse {head.slice(0, 7)}</Link>
        </div>
      </section>
    </main>
  );
}
