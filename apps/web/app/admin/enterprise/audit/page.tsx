import { filterAuditEvents } from "@/lib/demo-enterprise";
import { getSearchParamValue } from "@/lib/search-params";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q);
  const severity = getSearchParamValue(queryParams.severity) ?? "all";
  const events = filterAuditEvents(query, severity);

  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">admin / enterprise</div>
        <h1>Advanced audit log</h1>
        <p className="muted">
          Enterprise installs need an immutable view of permission changes, SSO events, CI gates, and destructive actions.
        </p>
        <form className="toolbar-grid top-gap-sm" method="get">
          <input defaultValue={query} name="q" placeholder="Search actor, action, target, or detail" type="text" />
          <input defaultValue={severity === "all" ? "" : severity} name="severity" placeholder="info, warning, critical" type="text" />
          <button className="button-secondary" type="submit">
            Filter
          </button>
        </form>
      </section>

      <section className="panel top-gap">
        <div className="comment-thread">
          {events.map((event) => (
            <article key={event.id} className="comment-card">
              <div className="section-header">
                <div>
                  <div className="meta-row">
                    <span className="pill">{event.action}</span>
                    <span className={`pill ${event.severity === "critical" ? "warn-pill" : event.severity === "warning" ? "accent-pill" : "success-pill"}`}>{event.severity}</span>
                  </div>
                  <h3>{event.target}</h3>
                </div>
                <span className="muted">{event.id}</span>
              </div>
              <p>{event.details}</p>
              <div className="meta-row muted">
                <span>{event.actor}</span>
                <span>{event.timestamp.replace("T", " ").replace("Z", " UTC")}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
