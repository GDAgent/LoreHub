import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime, labelStyle } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
import { getIssueDetail } from "@/lib/repo-data";
import { getSearchParamValue } from "@/lib/search-params";

type IssueDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    number: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar-button" style={{ width: 28, height: 28, fontSize: "0.72rem" }} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function IssueDetailPage({ params, searchParams }: IssueDetailPageProps) {
  const { org, repo, number } = await params;
  const queryParams = await searchParams;
  const sourced = await getIssueDetail(org, repo, Number(number));

  if (!sourced) {
    notFound();
  }

  const { data: issue, live } = sourced;

  // Lightweight optimistic overlay for the GET-based comment/close form. Real
  // persistence is wired through the API's POST endpoints; these previews keep
  // the interaction legible until the form is upgraded to a server action.
  const action = getSearchParamValue(queryParams.action);
  const commentBody = getSearchParamValue(queryParams.commentBody);
  const extraLabel = getSearchParamValue(queryParams.label);

  const comments = commentBody?.trim()
    ? [...issue.comments, { author: "You", body: commentBody.trim(), createdAt: new Date().toISOString() }]
    : issue.comments;
  const labels = extraLabel?.trim() && !issue.labels.includes(extraLabel.trim())
    ? [...issue.labels, extraLabel.trim()]
    : issue.labels;
  const state = action === "close" ? "closed" : action === "reopen" ? "open" : issue.state;

  const view = { ...issue, comments, labels, state };
  const open = view.state === "open";

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="issues" />
      </section>

      <header>
        <h1 style={{ marginBottom: "0.5rem" }}>
          {view.title} <span className="muted" style={{ fontWeight: 400 }}>#{view.number}</span>
        </h1>
        <div className="meta-row">
          <span className={`pill ${open ? "success-pill" : "warn-pill"}`} style={open ? {} : { color: "var(--done)" }}>
            {open ? "● Open" : "✓ Closed"}
          </span>
          <span className="muted">
            <strong>{view.author}</strong> opened this issue on {formatDateTime(view.createdAt)} · {view.comments.length} comments
          </span>
          <span className="pill muted-pill" title={live ? "Served from the live API" : "Served from demo data (API unavailable)"}>
            <span className={`merge-dot ${live ? "ok" : "muted"}`} style={{ width: 8, height: 8, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
            {live ? "live" : "demo"}
          </span>
        </div>
      </header>

      <div className="detail-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <article className="comment-card">
            <div className="meta-row">
              <Avatar name={view.author} />
              <strong>{view.author}</strong>
              <span className="muted">commented on {formatDateTime(view.createdAt)}</span>
            </div>
            <RichText org={org} repo={repo} text={view.body} />
          </article>

          {view.comments.map((comment, index) => (
              <article key={index} className="comment-card">
                <div className="meta-row">
                  <Avatar name={comment.author} />
                  <strong>{comment.author}</strong>
                  <span className="muted">commented on {formatDateTime(comment.createdAt)}</span>
                </div>
                <RichText org={org} repo={repo} text={comment.body} />
              </article>
            ))}

          <article className="panel">
            <h3>Add a comment</h3>
            <form className="form-grid" method="get">
              <div className="field">
                <textarea name="commentBody" placeholder="Leave a comment. Reference #14, tag @maya, or link r:f34ab29." rows={5} />
              </div>
              <div className="meta-row" style={{ justifyContent: "flex-end" }}>
                <Link className="button-secondary" href={`/${org}/${repo}/issues/${view.number}?action=${open ? "close" : "reopen"}`}>
                  {open ? "Close issue" : "Reopen issue"}
                </Link>
                <button className="button" type="submit">Comment</button>
              </div>
            </form>
          </article>
        </div>

        <aside>
          <div className="sidebar-block">
            <h4>Assignees</h4>
            {view.assignees.length === 0 ? (
              <span className="muted">No one assigned</span>
            ) : (
              view.assignees.map((assignee) => (
                <div key={assignee} className="meta-row">
                  <Avatar name={assignee} />
                  <span>{assignee}</span>
                </div>
              ))
            )}
          </div>
          <div className="sidebar-block">
            <h4>Labels</h4>
            <div className="meta-row">
              {view.labels.length === 0 ? <span className="muted">None yet</span> : view.labels.map((label) => (
                <span key={label} className="label" style={labelStyle(label)}>{label}</span>
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <h4>Milestone</h4>
            <span>{view.milestone ?? "No milestone"}</span>
          </div>
          <div className="sidebar-block">
            <h4>Actions</h4>
            <Link className="inline-link" href={`/${org}/${repo}/issues/${view.number}?label=blocked`}>Add “blocked” label</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
