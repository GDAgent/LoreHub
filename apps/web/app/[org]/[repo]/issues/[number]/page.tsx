import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { applyIssueActions, getIssue, getUser } from "@/lib/demo-collaboration";
import { formatDateTime, labelStyle } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
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
  const issue = getIssue(Number(number));

  if (!issue) {
    notFound();
  }

  const view = applyIssueActions(issue, {
    action: getSearchParamValue(queryParams.action),
    commentBody: getSearchParamValue(queryParams.commentBody),
    label: getSearchParamValue(queryParams.label),
  });
  const author = getUser(view.author);
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
            <strong>{author?.name ?? view.author}</strong> opened this issue on {formatDateTime(view.createdAt)} · {view.comments.length} comments
          </span>
        </div>
      </header>

      <div className="detail-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <article className="comment-card">
            <div className="meta-row">
              <Avatar name={author?.name ?? view.author} />
              <strong>{author?.name ?? view.author}</strong>
              <span className="muted">commented on {formatDateTime(view.createdAt)}</span>
            </div>
            <RichText org={org} repo={repo} text={view.body} />
          </article>

          {view.comments.map((comment) => {
            const commentAuthor = getUser(comment.author);
            return (
              <article key={comment.id} className="comment-card">
                <div className="meta-row">
                  <Avatar name={commentAuthor?.name ?? comment.author} />
                  <strong>{commentAuthor?.name ?? comment.author}</strong>
                  <span className="muted">commented on {formatDateTime(comment.createdAt)}</span>
                </div>
                <RichText org={org} repo={repo} text={comment.body} />
              </article>
            );
          })}

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
                  <Avatar name={getUser(assignee)?.name ?? assignee} />
                  <span>{getUser(assignee)?.name ?? assignee}</span>
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
