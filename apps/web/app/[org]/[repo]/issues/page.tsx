import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { buildCreatedIssue } from "@/lib/demo-collaboration";
import { formatDate, labelStyle } from "@/lib/format";
import { getIssues, type IssueRow } from "@/lib/repo-data";
import { getSearchParamValue } from "@/lib/search-params";

type IssuesPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function IssuesPage({ params, searchParams }: IssuesPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q)?.trim();
  const state = getSearchParamValue(queryParams.state) ?? "open";
  const label = getSearchParamValue(queryParams.label) ?? "all";
  const title = getSearchParamValue(queryParams.title);
  const body = getSearchParamValue(queryParams.body);
  const labels = getSearchParamValue(queryParams.labels);
  const assignees = getSearchParamValue(queryParams.assignees);

  const created = title?.trim() && body?.trim()
    ? buildCreatedIssue({ title, body, labels, assignees })
    : null;
  const createdIssue: IssueRow | null = created
    ? {
        number: created.number,
        title: created.title,
        state: created.state,
        labels: created.labels,
        author: "You",
        createdAt: created.createdAt,
        commentCount: created.comments.length,
      }
    : null;

  const { data: sourcedIssues, live } = await getIssues(org, repo);
  const allIssues = sourcedIssues.filter((issue) => {
    if (label !== "all" && !issue.labels.includes(label)) {
      return false;
    }
    if (query) {
      const haystack = `${issue.title} ${issue.labels.join(" ")}`.toLowerCase();
      return haystack.includes(query.toLowerCase());
    }
    return true;
  });
  const openCount = allIssues.filter((issue) => issue.state === "open").length;
  const closedCount = allIssues.filter((issue) => issue.state === "closed").length;
  const issues = state === "all" ? allIssues : allIssues.filter((issue) => issue.state === state);
  const visibleIssues = createdIssue ? [createdIssue, ...issues] : issues;
  const base = `/${org}/${repo}/issues`;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="issues" />
      </section>

      {createdIssue ? (
        <p className="success-text">✓ Created issue #{createdIssue.number}: {createdIssue.title}</p>
      ) : null}

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <div className="meta-row" style={{ justifyContent: "space-between" }}>
          <form method="get" style={{ flex: 1, maxWidth: 520 }}>
            <div className="field">
              <input name="q" defaultValue={query} placeholder="Search issues by title, body, or label" type="search" />
            </div>
          </form>
          <details>
            <summary className="button" style={{ listStyle: "none" }}>New issue</summary>
            <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(440px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
              <h3>Create issue</h3>
              <form className="form-grid" method="get">
                <div className="field">
                  <label htmlFor="title">Title</label>
                  <input id="title" name="title" placeholder="Texture streaming spikes in hero corridor" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="body">Description</label>
                  <textarea id="body" name="body" placeholder="Describe the issue. Use @mentions, #issues, and !change-requests." rows={5} required />
                </div>
                <div className="split-fields">
                  <div className="field">
                    <label htmlFor="labels">Labels</label>
                    <input id="labels" name="labels" placeholder="bug, priority:high" type="text" />
                  </div>
                  <div className="field">
                    <label htmlFor="assignees">Assignees</label>
                    <input id="assignees" name="assignees" placeholder="maya, iris" type="text" />
                  </div>
                </div>
                <button className="button" type="submit">Submit new issue</button>
              </form>
            </div>
          </details>
        </div>

        <div>
          <div className="meta-row" style={{ justifyContent: "flex-end", marginBottom: "0.4rem" }}>
            <span className="pill muted-pill" title={live ? "Served from the live API" : "Served from demo data (API unavailable)"}>
              <span className={`merge-dot ${live ? "ok" : "muted"}`} style={{ width: 8, height: 8, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
              {live ? "live" : "demo"}
            </span>
          </div>
          <div className="filter-bar">
            <Link href={`${base}?state=open`} className={state === "open" ? "active" : undefined}>
              <CircleDot /> {openCount} Open
            </Link>
            <Link href={`${base}?state=closed`} className={state === "closed" ? "active" : undefined}>
              ✓ {closedCount} Closed
            </Link>
          </div>
          {visibleIssues.length === 0 ? (
            <div className="list-rows"><div className="empty-state" style={{ border: "none" }}>No issues match this filter.</div></div>
          ) : (
            <div className="list-rows">
              {visibleIssues.map((issue) => (
                  <div key={issue.number} className="list-row">
                    <span className={`list-row-icon ${issue.state === "open" ? "state-open" : "state-closed"}`}>
                      {issue.state === "open" ? <CircleDot /> : <CheckCircle />}
                    </span>
                    <div className="list-row-main">
                      <div className="list-row-title">
                        <Link href={`/${org}/${repo}/issues/${issue.number}`}>{issue.title}</Link>
                        {issue.labels.map((issueLabel) => (
                          <span key={issueLabel} className="label" style={{ ...labelStyle(issueLabel), marginLeft: "0.4rem" }}>
                            {issueLabel}
                          </span>
                        ))}
                      </div>
                      <div className="list-row-meta">
                        <span>#{issue.number}</span>
                        <span>opened {formatDate(issue.createdAt)} by {issue.author}</span>
                        {issue.milestone ? <span>· {issue.milestone}</span> : null}
                        {issue.commentCount > 0 ? <span>💬 {issue.commentCount}</span> : null}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function CircleDot() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function CheckCircle() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}
