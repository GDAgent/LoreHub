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
              Repository home for the collaboration shell. Phase 2 adds issues, change requests,
              mentions, notifications, teams, and permissions without breaking the Phase 1 VCS flow.
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
          <h2>Phase 2 collaboration surface</h2>
          <ul className="list">
            <li>Issue search, labels, comments, and close flows now live alongside repo navigation.</li>
            <li>Change requests support reviews, inline comments, approvals, and merges.</li>
            <li>Org notifications, teams, and permission matrices are linked into the same shell.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Next backend milestones</h2>
          <ul className="list">
            <li>Persist issue, CR, and notification state in the API and PostgreSQL.</li>
            <li>Attach org roles and team membership to authenticated users and ACL checks.</li>
            <li>Wire review approvals and merges to Lore-backed branch movement rules.</li>
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
          <h2>Active CR</h2>
          <p className="muted">Change request !7 carries the current art pass, review discussion, and inline comments.</p>
          <Link className="button-secondary" href={`/${org}/${repo}/cr/7`}>
            Open change request !7
          </Link>
        </article>
      </section>
    </main>
  );
}
