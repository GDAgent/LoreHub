import Link from "next/link";

import { listNotifications } from "@/lib/demo-collaboration";
import { formatDateTime } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
import { getSearchParamValue } from "@/lib/search-params";

type NotificationsPageProps = {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "review", label: "Reviews" },
  { id: "email", label: "Email" },
] as const;

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const { org } = await params;
  const queryParams = await searchParams;
  const filter = getSearchParamValue(queryParams.filter) ?? "all";
  const notifications = listNotifications(filter);
  const base = `/${org}/notifications`;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}><strong>{org}</strong></Link>
        </div>
        <nav className="route-strip" aria-label="Organization sections">
          <Link href={`/${org}/settings`}>Settings</Link>
          <Link href={`/${org}/teams`}>Teams</Link>
          <Link href={`/${org}/notifications`} className="active" aria-current="page">Notifications</Link>
        </nav>
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Notifications</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>In-app inbox mirrored to email so review and permission events reach you in both channels.</p>
        </div>
        <button className="button-secondary" type="button">Mark all as read</button>
      </div>

      <div className="meta-row" style={{ flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <Link
              key={f.id}
              href={f.id === "all" ? base : `${base}?filter=${f.id}`}
              className={`pill ${active ? "" : "muted-pill"}`}
              style={active ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand)" } : {}}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {notifications.length ? (
        <div className="list-rows">
          {notifications.map((notification) => (
            <div key={notification.id} className={`list-row${notification.read ? "" : " unread-row"}`}>
              <span className={`list-row-icon ${notification.read ? "state-draft" : "state-open"}`}>
                <BellIcon />
              </span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={notification.href}>{notification.title}</Link>
                  <span className="pill muted-pill" style={{ marginLeft: "0.5rem" }}>{notification.kind}</span>
                  {notification.read ? null : <span className="pill accent-pill" style={{ marginLeft: "0.35rem" }}>unread</span>}
                </div>
                <div style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>
                  <RichText org={org} repo="demo" text={notification.body} />
                </div>
                <div className="list-row-meta">
                  <span>{formatDateTime(notification.createdAt)}</span>
                  <span>· email {notification.emailStatus}</span>
                </div>
              </div>
              <div className="meta-row">
                <Link className="button-secondary" href={notification.href}>Open</Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>You&rsquo;re all caught up</h3>
          <p className="muted">No notifications match this filter.</p>
        </div>
      )}
    </main>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
