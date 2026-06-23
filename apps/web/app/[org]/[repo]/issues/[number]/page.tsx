import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime, labelStyle } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
import { getIssueDetail } from "@/lib/repo-data";

import { addIssueCommentAction, setIssueStateAction } from "./actions";

type IssueDetailPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    number: string;
  }>;
};

function Avatar({ name }: { name: string }) {
  return (
    <span className="avatar-button" style={{ width: 28, height: 28, fontSize: "0.72rem" }} aria-hidden="true">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { org, repo, number } = await params;
  const issueNumber = Number(number);
  const view = await getIssueDetail(org, repo, issueNumber);

  if (!view) {
    notFound();
  }

  const open = view.state === "open";
  const addComment = addIssueCommentAction.bind(null, org, repo, issueNumber);
  const toggleState = setIssueStateAction.bind(null, org, repo, issueNumber, open ? "closed" : "open");

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
            <form className="form-grid" action={addComment}>
              <div className="field">
                <textarea name="commentBody" placeholder="Leave a comment. Reference #14, tag @maya, or link r:f34ab29." rows={5} required />
              </div>
              <div className="meta-row" style={{ justifyContent: "flex-end" }}>
                <button className="button" type="submit">Comment</button>
              </div>
            </form>
            <form action={toggleState} className="top-gap-sm">
              <button className="button-secondary" type="submit">
                {open ? "Close issue" : "Reopen issue"}
              </button>
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
        </aside>
      </div>
    </main>
  );
}
