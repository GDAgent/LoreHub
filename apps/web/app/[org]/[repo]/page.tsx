type RepositoryPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

const sections = ["Code", "Revisions", "Branches", "Issues", "Change Requests", "Settings"];

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
              Repository home for the initial Phase 0 shell. This page anchors the primary
              sections that the Lore-native browsing experience will expand in later phases.
            </p>
          </div>
          <a className="button" href="/login">
            Authenticate for write access
          </a>
        </div>
        <div className="route-strip">
          {sections.map((section) => (
            <span key={section}>{section}</span>
          ))}
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Next backend milestones</h2>
          <ul className="list">
            <li>Replace the placeholder Lore partition provisioner with a real Lore transport.</li>
            <li>Attach authenticated org ownership checks to repository CRUD.</li>
            <li>Expose repo lookup by slug alongside UUID-based endpoints.</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Current API surface</h2>
          <ul className="list">
            <li>`GET /health`</li>
            <li>`GET /api/v1/repositories`</li>
            <li>`POST /api/v1/repositories`</li>
            <li>`GET /api/v1/repositories/:id`</li>
            <li>`POST /api/v1/repositories/:id/lore-token`</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
