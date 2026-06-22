import Link from "next/link";

import { AdminTabs } from "@/components/admin-tabs";
import { filterAuditEvents } from "@/lib/demo-enterprise";
import { formatDateTime } from "@/lib/format";
import { getSearchParamValue } from "@/lib/search-params";

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SEVERITIES = [
  { id: "all", label: "All" },
  { id: "info", label: "Info" },
  { id: "warning", label: "Warning" },
  { id: "critical", label: "Critical" },
] as const;

const SEV_PILL: Record<string, string> = {
  critical: "warn-pill",
  warning: "accent-pill",
  info: "success-pill",
};

export default async function AuditPage({ searchParams }: AuditPageProps) {
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q) ?? "";
  const severity = getSearchParamValue(queryParams.severity) ?? "all";
  const events = filterAuditEvents(query, severity);

  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="audit" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Advanced audit log</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Immutable record of permission changes, SSO events, CI gates, and destructive actions.</p>
        </div>
        <button className="button-secondary" type="button">Export CSV</button>
      </div>

      <form method="get" className="filter-search">
        <input name="q" defaultValue={query} placeholder="Search actor, action, target, or detail…" type="search" aria-label="Search audit log" />
        {severity !== "all" ? <input type="hidden" name="severity" value={severity} /> : null}
        <button className="button" type="submit">Search</button>
      </form>

      <div className="meta-row" style={{ flexWrap: "wrap" }}>
        {SEVERITIES.map((s) => {
          const active = severity === s.id;
          const href = s.id === "all"
            ? `/admin/enterprise/audit${query ? `?q=${encodeURIComponent(query)}` : ""}`
            : `/admin/enterprise/audit?severity=${s.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          return (
            <Link
              key={s.id}
              href={href}
              className={`pill ${active ? "" : "muted-pill"}`}
              style={active ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand)" } : {}}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {events.length ? (
        <div className="list-rows">
          {events.map((event) => (
            <div key={event.id} className="list-row">
              <span className={`list-row-icon ${event.severity === "critical" ? "state-danger" : event.severity === "warning" ? "state-draft" : "state-open"}`}>
                <ShieldIcon />
              </span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <strong>{event.target}</strong>
                  <span className={`pill ${SEV_PILL[event.severity] ?? "muted-pill"}`} style={{ marginLeft: "0.5rem" }}>{event.severity}</span>
                  <span className="pill muted-pill" style={{ marginLeft: "0.35rem" }}>{event.action}</span>
                </div>
                <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{event.details}</p>
                <div className="list-row-meta">
                  <span>{event.actor}</span>
                  <span>· {formatDateTime(event.timestamp)}</span>
                  <span>· {event.id}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No matching events</h3>
          <p className="muted">Adjust your search or severity filter.</p>
        </div>
      )}
    </main>
  );
}

function ShieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
    </svg>
  );
}
