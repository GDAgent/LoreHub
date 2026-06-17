export default function ExplorePage() {
  return (
    <main className="shell page">
      <section className="panel">
        <h1>Explore</h1>
        <p className="muted">
          Public discovery is a first-class route from the start, even before search,
          ranking, and asset facets are implemented.
        </p>
      </section>
      <section className="grid three">
        <article className="panel">
          <h2>Unreal Templates</h2>
          <p className="muted">Starter repos with Lore-friendly binary history and branch hygiene.</p>
        </article>
        <article className="panel">
          <h2>Shared Assets</h2>
          <p className="muted">Discover image, audio, and model-heavy repos once asset indexing lands.</p>
        </article>
        <article className="panel">
          <h2>Team Spaces</h2>
          <p className="muted">Org-scoped collections for studios, internal templates, and exemplars.</p>
        </article>
      </section>
    </main>
  );
}
