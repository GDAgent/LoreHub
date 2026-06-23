import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDate, labelStyle } from "@/lib/format";
import { getIssues } from "@/lib/repo-data";
import { getSearchParamValue } from "@/lib/search-params";

import { createIssueAction } from "./actions";

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
  const error = getSearchParamValue(queryParams.error);

  const sourcedIssues = await getIssues(org, repo);
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
  const visibleIssues = state === "all" ? allIssues : allIssues.filter((issue) => issue.state === state);
  const base = `/${org}/${repo}/issues`;
  const createIssue = createIssueAction.bind(null, org, repo);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="issues" />
      </section>

      {error ? (
        <p className="error-text">Could not create issue: {error}</p>
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
              <form className="form-grid" action={createIssue}>
                <div className="field">
                  <label htmlFor="title">Title</label>
                  <input id="title" name="title" placeholder="Texture streaming spikes in hero corridor" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="body">Description</label>
                  <textarea id="body" name="body" placeholder="Describe the issue. Use @mentions, #issues, and !change-requests." rows={5} required />
                </div>
                <button className="button" type="submit">Submit new issue</button>
              </form>
            </div>
          </details>
        </div>

        <div>
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
