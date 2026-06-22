import Link from "next/link";

import { AdminTabs } from "@/components/admin-tabs";

const SERVICES = [
  { name: "API", detail: "Heartbeat & request latency", status: "operational" },
  { name: "Worker", detail: "CI, search indexing, email", status: "operational" },
  { name: "Lore server", detail: "VCS data & fragment transfer", status: "operational" },
  { name: "PostgreSQL", detail: "Metadata store & migrations", status: "operational" },
  { name: "Redis", detail: "Cache & job queue", status: "degraded" },
  { name: "Object storage", detail: "Immutable chunk store", status: "operational" },
];

export default function AdminPage() {
  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="overview" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>System overview</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Enterprise identity, directory sync, auditability, cloud billing, and SLA reporting.</p>
        </div>
      </div>

      <section className="grid four">
        <article className="panel stat-panel"><span className="muted">Services up</span><strong>5 / 6</strong></article>
        <article className="panel stat-panel"><span className="muted">Active users</span><strong>1,284</strong></article>
        <article className="panel stat-panel"><span className="muted">Repositories</span><strong>342</strong></article>
        <article className="panel stat-panel"><span className="muted">Storage</span><strong>4.7 TB</strong></article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Service health</h2>
        <table className="table">
          <thead>
            <tr><th>Service</th><th>Detail</th><th>Status</th></tr>
          </thead>
          <tbody>
            {SERVICES.map((s) => (
              <tr key={s.name}>
                <td><strong>{s.name}</strong></td>
                <td className="muted">{s.detail}</td>
                <td>
                  <span className={`pill ${s.status === "operational" ? "success-pill" : "warn-pill"}`}>{s.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Enterprise controls</h2>
          <div className="sso-card-list">
            <Link className="button-secondary" href="/admin/enterprise/auth">SAML &amp; OIDC</Link>
            <Link className="button-secondary" href="/admin/enterprise/directory">LDAP / directory sync</Link>
            <Link className="button-secondary" href="/admin/enterprise/audit">Advanced audit log</Link>
            <Link className="button-secondary" href="/admin/enterprise/sla">SLA dashboard</Link>
          </div>
        </article>
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Cloud operations</h2>
          <div className="sso-card-list">
            <Link className="button-secondary" href="/admin/cloud/billing">Billing integration</Link>
            <Link className="button-secondary" href="/acme/demo/pipelines">CI/CD overview</Link>
            <Link className="button-secondary" href="/acme/demo/analytics">Storage analytics</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
