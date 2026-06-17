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
  {
    label: "Diff",
    href: (org: string, repo: string) => `/${org}/${repo}/diff/7c91ae447bc2/f34ab29ce810`,
  },
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
              Repository home for the Phase 1 browsing shell. It now links the first revision,
              tree, branch, diff, and Lore CLI push surfaces into one navigable flow.
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
          <h2>Phase 1 in motion</h2>
          <ul className="list">
            <li>Tree browsing works at any sample revision and path.</li>
            <li>Code files render inline while binary assets are clearly identified.</li>
            <li>Revision, branch, DAG, diff, and CLI push pages are linked from the repo home.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Next backend milestones</h2>
          <ul className="list">
            <li>Replace the placeholder Lore partition provisioner with a real Lore transport.</li>
            <li>Attach repository browsing routes to Lore-backed revision and tree APIs.</li>
            <li>Persist branch creation and diff generation beyond the demo dataset.</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
