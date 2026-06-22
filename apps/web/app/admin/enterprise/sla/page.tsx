import { AdminTabs } from "@/components/admin-tabs";
import { incidents, slaOverview } from "@/lib/demo-enterprise";
import { formatDateTime } from "@/lib/format";

const STATUS_PILL: Record<string, string> = {
  resolved: "success-pill",
  monitoring: "accent-pill",
  investigating: "warn-pill",
};

export default function EnterpriseSlaPage() {
  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="sla" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>SLA dashboard</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Live service-level view: uptime, latency, error budget, and incident history.</p>
        </div>
      </div>

      <section className="grid three">
        <article className="panel stat-panel"><span className="muted">Uptime (30d)</span><strong style={{ color: "var(--success)" }}>{slaOverview.uptime}</strong></article>
        <article className="panel stat-panel"><span className="muted">API latency P95</span><strong>{slaOverview.apiLatencyP95}</strong></article>
        <article className="panel stat-panel"><span className="muted">Error budget</span><strong>{slaOverview.errorBudget}</strong></article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Incident history</h2>
        {incidents.length ? (
          <div className="list-rows">
            {incidents.map((incident) => (
              <div key={incident.id} className="list-row">
                <span className={`list-row-icon ${incident.status === "resolved" ? "state-open" : "state-danger"}`}>
                  <PulseIcon />
                </span>
                <div className="list-row-main">
                  <div className="list-row-title">
                    <strong>{incident.title}</strong>
                    <span className={`pill ${STATUS_PILL[incident.status] ?? "muted-pill"}`} style={{ marginLeft: "0.5rem" }}>{incident.status}</span>
                  </div>
                  <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{incident.impact}</p>
                  <div className="list-row-meta">
                    <span>{incident.id}</span>
                    <span>· started {formatDateTime(incident.startedAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No incidents</h3>
            <p className="muted">All services have been operating within SLA.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function PulseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 12h4l3 8 4-16 3 8h4" />
    </svg>
  );
}
