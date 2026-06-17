export default function AdminPage() {
  return (
    <main className="shell page">
      <section className="panel">
        <h1>Admin</h1>
        <p className="muted">
          The admin surface is stubbed now so Phase 1 and Phase 2 work can attach health,
          storage, and worker controls without rerouting the application.
        </p>
        <div className="grid two">
          <article className="panel">
            <h2>Service health</h2>
            <ul className="list">
              <li>API and worker heartbeat</li>
              <li>Lore server connectivity</li>
              <li>PostgreSQL migration status</li>
            </ul>
          </article>
          <article className="panel">
            <h2>CE stack inventory</h2>
            <ul className="list">
              <li>PostgreSQL metadata store</li>
              <li>Redis cache and queue placeholder</li>
              <li>MinIO object storage baseline</li>
            </ul>
          </article>
        </div>
      </section>
    </main>
  );
}
