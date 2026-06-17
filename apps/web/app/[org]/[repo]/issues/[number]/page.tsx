import Link from "next/link";
import { notFound } from "next/navigation";

import { applyIssueActions, getIssue, getUser } from "@/lib/demo-collaboration";
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

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>#{view.number} {view.title}</h1>
            </div>
            <span className={`pill ${view.state === "closed" ? "warn-pill" : "success-pill"}`}>{view.state}</span>
          </div>
          <div className="meta-row muted">
            <span>{author?.name ?? view.author}</span>
            <span>{view.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
            <span>{view.comments.length} comments</span>
          </div>
          <div className="meta-row top-gap-sm">
            {view.labels.map((label) => (
              <span key={label} className="pill muted-pill">{label}</span>
            ))}
          </div>
          <RichText org={org} repo={repo} text={view.body} />
          <div className="cta-row compact">
            <Link
              className="button-secondary"
              href={`/${org}/${repo}/issues/${view.number}?action=${view.state === "open" ? "close" : "reopen"}`}
            >
              {view.state === "open" ? "Close issue" : "Reopen issue"}
            </Link>
            <Link className="button-secondary" href={`/${org}/${repo}/issues/${view.number}?label=blocked`}>
              Add label: blocked
            </Link>
          </div>

          <div className="top-gap comment-thread">
            {view.comments.map((comment) => {
              const commentAuthor = getUser(comment.author);
              return (
                <article key={comment.id} className="comment-card">
                  <div className="meta-row muted">
                    <span>{commentAuthor?.name ?? comment.author}</span>
                    <span>{comment.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
                  </div>
                  <RichText org={org} repo={repo} text={comment.body} />
                </article>
              );
            })}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Add comment</h2>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="commentBody">Comment</label>
              <textarea id="commentBody" name="commentBody" placeholder="Reference #14, tag @maya, or explain the next fix." rows={6} />
            </div>
            <button className="button" type="submit">
              Post comment
            </button>
          </form>
          <div className="top-gap section-divider" />
          <h2>Participants</h2>
          <ul className="list">
            {view.assignees.map((assignee) => (
              <li key={assignee}>{getUser(assignee)?.name ?? assignee}</li>
            ))}
          </ul>
          <p className="muted">Milestone: {view.milestone ?? "Unscheduled"}</p>
        </article>
      </section>
    </main>
  );
}
