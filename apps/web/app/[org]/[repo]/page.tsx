import Link from "next/link";

import { demoRevisions } from "@/lib/demo-repository";

type RepositoryPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

const sections = [
  { label: "Code", href: (org: string, repo: string) => `/${org}/${repo}/tree/${demoRevisions[0].hash}` },
  { label: "Revisions", href: (org: string, repo: string) => `/${org}/${repo}/revisions` },
  { label: "Branches", href: (org: string, repo: string) => `/${org}/${repo}/branches` },
  { label: "Issues", href: (org: string, repo: string) => `/${org}/${repo}/issues` },
  { label: "CRs", href: (org: string, repo: string) => `/${org}/${repo}/cr` },
  { label: "Pipelines", href: (org: string, repo: string) => `/${org}/${repo}/pipelines` },
  { label: "Assets", href: (org: string, repo: string) => `/${org}/${repo}/assets` },
  { label: "Locks", href: (org: string, repo: string) => `/${org}/${repo}/locks` },
  { label: "Analytics", href: (org: string, repo: string) => `/${org}/${repo}/analytics` },
  { label: "Obliterate", href: (org: string, repo: string) => `/${org}/${repo}/obliterate` },
  {
    label: "Diff",
    href: (org: string, repo: string) => `/${org}/${repo}/diff/7c91ae447bc2/f34ab29ce810`,
  },
  { label: "Settings", href: (org: string, repo: string) => `/${org}/${repo}/settings` },
  { label: "Push", href: (org: string, repo: string) => `/${org}/${repo}/push` },
];

export default async function RepositoryPage({ params }: RepositoryPageProps) {
  const { org, repo } = await params;

  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-title">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>{repo}</h1>
            <p className="muted">
              Repository home for the collaboration, game-dev, and CI shell. Phase 4 adds pipeline-as-code, runner details,
              WebSocket logs, Lore-backed artifact partitions, and CR merge gates.
            </p>
          </div>
          <Link className="button" href={`/${org}/${repo}/tree/${demoRevisions[0].hash}`}>
            Open latest snapshot
          </Link>
        </div>
        <div className="route-strip">
          {sections.map((section) => (
            <Link key={section.label} href={section.href(org, repo)}>
              {section.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Phase 4 CI/CD surface</h2>
          <ul className="list">
            <li>Pipelines now expose YAML config, runner metadata, logs, and artifact partitions.</li>
            <li>The API streams live demo job logs over WebSocket for the active run.</li>
            <li>Change requests now show merge gates driven by approvals and CI state.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Next backend milestones</h2>
          <ul className="list">
            <li>Persist pipeline definitions, runs, and logs in the API and metadata store.</li>
            <li>Execute real sparse Lore checkouts in the worker runner instead of demo traces.</li>
            <li>Attach environment deployment approvals and cache metrics to run detail views.</li>
          </ul>
        </article>
      </section>

      <section className="grid three top-gap">
        <article className="panel">
          <h2>Organization</h2>
          <div className="stack-links">
            <Link href={`/${org}/settings`}>Org settings</Link>
            <Link href={`/${org}/teams`}>Teams</Link>
            <Link href={`/${org}/notifications`}>Notifications</Link>
          </div>
        </article>
        <article className="panel">
          <h2>Open issue</h2>
          <p className="muted">Issue #12 tracks the active HUD regression blocking art capture sign-off.</p>
          <Link className="button-secondary" href={`/${org}/${repo}/issues/12`}>
            Open issue #12
          </Link>
        </article>
        <article className="panel">
          <h2>Active asset</h2>
          <p className="muted">The hero corridor albedo now has a dedicated metadata page and binary diff view.</p>
          <Link className="button-secondary" href={`/${org}/${repo}/assets/hero-corridor-albedo`}>
            Open asset detail
          </Link>
        </article>
        <article className="panel">
          <h2>Active pipeline</h2>
          <p className="muted">Run `run-107` is streaming logs for the art review build and currently gates merge on !7.</p>
          <Link className="button-secondary" href={`/${org}/${repo}/pipelines/run-107`}>
            Open pipeline run
          </Link>
        </article>
      </section>
    </main>
  );
}
