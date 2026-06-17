import { incidents, slaOverview } from "@/lib/demo-enterprise";

export default function EnterpriseSlaPage() {
  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">admin / enterprise</div>
        <h1>SLA dashboard</h1>
        <p className="muted">
          Enterprise operations get a live service-level view that tracks uptime, latency, error budget, and incident history.
        </p>
      </section>

      <section className="grid three top-gap">
        <article className="panel stat-panel">
          <span className="muted">Uptime</span>
          <strong>{slaOverview.uptime}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">API latency P95</span>
          <strong>{slaOverview.apiLatencyP95}</strong>
        </article>
        <article className="panel stat-panel">
          <span className="muted">Error budget</span>
          <strong>{slaOverview.errorBudget}</strong>
        </article>
      </section>

      <section className="panel top-gap">
        <h2>Incidents</h2>
        <div className="comment-thread top-gap-sm">
          {incidents.map((incident) => (
            <article key={incident.id} className="comment-card">
              <div className="section-header">
                <div>
                  <div className="meta-row">
                    <span className="pill">{incident.id}</span>
                    <span className={`pill ${incident.status === "resolved" ? "success-pill" : incident.status === "monitoring" ? "accent-pill" : "warn-pill"}`}>{incident.status}</span>
                  </div>
                  <h3>{incident.title}</h3>
                </div>
                <span className="muted">{incident.startedAt.replace("T", " ").replace("Z", " UTC")}</span>
              </div>
              <p className="muted">{incident.impact}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
