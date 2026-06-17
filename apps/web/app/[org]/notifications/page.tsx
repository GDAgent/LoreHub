import Link from "next/link";

import { listNotifications } from "@/lib/demo-collaboration";
import { RichText } from "@/lib/render-rich-text";
import { getSearchParamValue } from "@/lib/search-params";

type NotificationsPageProps = {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NotificationsPage({ params, searchParams }: NotificationsPageProps) {
  const { org } = await params;
  const queryParams = await searchParams;
  const filter = getSearchParamValue(queryParams.filter) ?? "all";
  const notifications = listNotifications(filter);

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org}</div>
            <h1>Notifications</h1>
          </div>
          <Link className="button-secondary" href={`/${org}/settings`}>
            Org settings
          </Link>
        </div>
        <form className="toolbar-grid top-gap-sm" method="get">
          <input defaultValue={filter === "all" ? "" : filter} name="filter" placeholder="all, unread, email, review" type="text" />
          <button className="button-secondary" type="submit">
            Filter
          </button>
        </form>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>In-app inbox</h2>
          <div className="comment-thread top-gap-sm">
            {notifications.map((notification) => (
              <article key={notification.id} className="comment-card">
                <div className="section-header">
                  <div>
                    <div className="meta-row">
                      <span className="pill">{notification.kind}</span>
                      <span className={`pill ${notification.read ? "muted-pill" : "accent-pill"}`}>{notification.read ? "read" : "unread"}</span>
                    </div>
                    <h3>{notification.title}</h3>
                  </div>
                  <Link className="button-secondary" href={notification.href}>
                    Open
                  </Link>
                </div>
                <RichText org={org} repo="demo" text={notification.body} />
                <p className="muted">{notification.createdAt.replace("T", " ").replace("Z", " UTC")}</p>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Email dispatch</h2>
          <div className="comment-thread top-gap-sm">
            {notifications.map((notification) => (
              <article key={`${notification.id}-email`} className="comment-card">
                <div className="meta-row">
                  <span className="pill muted-pill">email</span>
                  <span className={`pill ${notification.emailStatus === "sent" ? "success-pill" : "accent-pill"}`}>{notification.emailStatus}</span>
                </div>
                <p>{notification.title}</p>
                <p className="muted">Delivery mirrors the in-app notification stream so critical review and permission events reach collaborators in both channels.</p>
              </article>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
