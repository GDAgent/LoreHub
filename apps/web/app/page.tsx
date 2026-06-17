import Link from "next/link";

const coreTracks = [
  {
    title: "API foundation",
    body: "Axum service with repository CRUD, SQLx migrations, and Lore JWT issuance for partition-scoped access.",
  },
  {
    title: "Lore seam",
    body: "A shared Rust client crate isolates Lore partition provisioning so the future lore-capi or gRPC binding can drop in cleanly.",
  },
  {
    title: "CE deployment",
    body: "Compose wiring for API, web, worker, PostgreSQL, Redis, MinIO, and a configurable lore-server image.",
  },
];

export default function HomePage() {
  return (
    <main className="shell hero">
      <span className="eyebrow">Phase 0 foundation</span>
      <div className="hero-grid">
        <section className="panel">
          <h1>GitHub-style collaboration for Lore repositories.</h1>
          <p className="muted">
            This initial shell wires the first backend flows, the core monorepo layout,
            and the first navigation paths for auth, repo views, and admin entry points.
          </p>
          <div className="cta-row">
            <Link className="button" href="/acme/demo">
              Open demo repository
            </Link>
            <Link className="button-secondary" href="/explore">
              Browse public repos
            </Link>
          </div>
          <div className="stats">
            <div className="stat">
              <strong>4</strong>
              <span className="muted">Rust workspace crates</span>
            </div>
            <div className="stat">
              <strong>1</strong>
              <span className="muted">SQL migration baseline</span>
            </div>
            <div className="stat">
              <strong>7</strong>
              <span className="muted">Compose services wired</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>Phase 0 tracks</h2>
          <div className="grid">
            {coreTracks.map((track) => (
              <article key={track.title} className="panel">
                <h3>{track.title}</h3>
                <p className="muted">{track.body}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
