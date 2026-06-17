export default function AdminPage() {
  return (
    <main className="shell page">
      <section className="panel">
        <h1>Admin</h1>
        <p className="muted">
          The admin surface now covers enterprise identity, directory sync, auditability,
          cloud billing, and SLA reporting alongside the earlier system controls.
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
        <div className="grid two top-gap">
          <article className="panel">
            <h2>Enterprise controls</h2>
            <div className="stack-links">
              <a href="/admin/enterprise/auth">SAML and OIDC</a>
              <a href="/admin/enterprise/directory">LDAP sync</a>
              <a href="/admin/enterprise/audit">Advanced audit log</a>
              <a href="/admin/enterprise/sla">SLA dashboard</a>
            </div>
          </article>
          <article className="panel">
            <h2>Cloud operations</h2>
            <div className="stack-links">
              <a href="/admin/cloud/billing">Billing integration</a>
              <a href="/acme/demo/pipelines">CI/CD overview</a>
              <a href="/acme/demo/analytics">Storage analytics</a>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
