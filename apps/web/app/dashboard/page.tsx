import Link from "next/link";

import { demoChangeRequests, demoIssues, demoNotifications } from "@/lib/demo-collaboration";
import { demoRevisions } from "@/lib/demo-repository";
import { formatDateTime } from "@/lib/format";

const CURRENT_USER = "rin";
const REPO = { org: "acme", repo: "demo" };

const YOUR_REPOS = [
  { org: "acme", repo: "demo", description: "Reference arena vertical slice.", storage: "67.6 MB", updated: "2h ago" },
  { org: "acme", repo: "toolkit", description: "Shared editor scripts and validation hooks.", storage: "8.2 MB", updated: "1d ago" },
  { org: "acme", repo: "audio-bank", description: "SFX and ambience library.", storage: "812 MB", updated: "3d ago" },
];

export default function DashboardPage() {
  const assignedIssues = demoIssues.filter((i) => i.state === "open" && i.assignees.includes(CURRENT_USER));
  const yourCrs = demoChangeRequests.filter(
    (cr) => cr.state !== "merged" && (cr.reviewers.includes(CURRENT_USER) || cr.author === CURRENT_USER),
  );
  const recent = demoRevisions.slice(0, 5);

  return (
    <main className="shell page">
      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Welcome back, Rin</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Your repositories, assigned work, and recent activity.</p>
        </div>
        <Link className="button" href={`/${REPO.org}/${REPO.repo}/push`}>Push with Lore CLI</Link>
      </div>

      <section className="grid four">
        <article className="panel stat-panel"><span className="muted">Your repos</span><strong>{YOUR_REPOS.length}</strong></article>
        <article className="panel stat-panel"><span className="muted">Assigned issues</span><strong>{assignedIssues.length}</strong></article>
        <article className="panel stat-panel"><span className="muted">Reviews requested</span><strong>{yourCrs.length}</strong></article>
        <article className="panel stat-panel"><span className="muted">Unread</span><strong>{demoNotifications.filter((n) => !n.read).length}</strong></article>
      </section>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <section className="panel">
            <div className="section-header">
              <h2 style={{ margin: 0 }}>Assigned to you</h2>
              <Link className="inline-link" href={`/${REPO.org}/${REPO.repo}/issues`}>View all</Link>
            </div>
            {assignedIssues.length ? (
              <div className="list-rows" style={{ marginTop: "0.75rem" }}>
                {assignedIssues.map((issue) => (
                  <div key={issue.number} className="list-row">
                    <span className="list-row-icon state-open"><DotIcon /></span>
                    <div className="list-row-main">
                      <div className="list-row-title">
                        <Link href={`/${REPO.org}/${REPO.repo}/issues/${issue.number}`}>{issue.title}</Link>
                      </div>
                      <div className="list-row-meta">
                        <span>#{issue.number}</span>
                        <span>· opened {formatDateTime(issue.createdAt)}</span>
                        {issue.labels.length ? <span>· {issue.labels.join(", ")}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>No open issues assigned to you.</p>
            )}
          </section>

          <section className="panel">
            <div className="section-header">
              <h2 style={{ margin: 0 }}>Change requests needing you</h2>
              <Link className="inline-link" href={`/${REPO.org}/${REPO.repo}/cr`}>View all</Link>
            </div>
            {yourCrs.length ? (
              <div className="list-rows" style={{ marginTop: "0.75rem" }}>
                {yourCrs.map((cr) => (
                  <div key={cr.number} className="list-row">
                    <span className={`list-row-icon ${cr.state === "draft" ? "state-draft" : "state-open"}`}><MergeIcon /></span>
                    <div className="list-row-main">
                      <div className="list-row-title">
                        <Link href={`/${REPO.org}/${REPO.repo}/cr/${cr.number}`}>{cr.title}</Link>
                        {cr.state === "draft" ? <span className="pill muted-pill" style={{ marginLeft: "0.5rem" }}>draft</span> : null}
                      </div>
                      <div className="list-row-meta">
                        <span>#{cr.number}</span>
                        <span>· <code style={{ fontSize: "0.8em" }}>{cr.sourceBranch}</code> → <code style={{ fontSize: "0.8em" }}>{cr.targetBranch}</code></span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted" style={{ marginBottom: 0 }}>No change requests need your attention.</p>
            )}
          </section>

          <section className="panel">
            <h2 style={{ marginTop: 0 }}>Recent activity</h2>
            <div className="list-rows">
              {recent.map((rev) => (
                <div key={rev.hash} className="list-row">
                  <span className="list-row-icon state-open"><DotIcon /></span>
                  <div className="list-row-main">
                    <div className="list-row-title">
                      <Link href={`/${REPO.org}/${REPO.repo}/revisions/${rev.hash}`}>{rev.title}</Link>
                    </div>
                    <div className="list-row-meta">
                      <code style={{ fontSize: "0.8em" }}>{rev.shortHash}</code>
                      <span>· {rev.author}</span>
                      <span>· {formatDateTime(rev.authoredAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="panel">
            <div className="section-header">
              <h3 style={{ margin: 0 }}>Your repositories</h3>
              <Link className="inline-link" href="/explore">Explore</Link>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.75rem" }}>
              {YOUR_REPOS.map((r) => (
                <div key={`${r.org}/${r.repo}`}>
                  <Link href={`/${r.org}/${r.repo}`} style={{ fontWeight: 600 }}>{r.org}/{r.repo}</Link>
                  <p className="muted" style={{ margin: "0.2rem 0", fontSize: "0.85rem" }}>{r.description}</p>
                  <div className="list-row-meta" style={{ marginTop: 0 }}>
                    <span>{r.storage}</span>
                    <span>· {r.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3 style={{ marginTop: 0 }}>Notifications</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
              {demoNotifications.slice(0, 4).map((n) => (
                <Link key={n.id} href={n.href} style={{ display: "block" }}>
                  <div className="list-row-title" style={{ fontSize: "0.9rem" }}>
                    {n.read ? null : <span className="merge-dot ok" style={{ width: 8, height: 8, display: "inline-block", marginRight: 6 }} />}
                    {n.title}
                  </div>
                  <div className="list-row-meta" style={{ marginTop: "0.1rem" }}>
                    <span>{n.kind}</span>
                    <span>· {formatDateTime(n.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
            <Link className="button-secondary" href={`/${REPO.org}/notifications`} style={{ marginTop: "0.85rem" }}>All notifications</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}

function DotIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="9" r="3" />
      <path d="M6 9v6M18 12a9 9 0 0 1-9 6" />
    </svg>
  );
}
