import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { formatDateTime, labelStyle } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
import { getChangeRequestDetail } from "@/lib/repo-data";
import { getSearchParamValue } from "@/lib/search-params";

import {
  approveChangeRequestAction,
  commentChangeRequestAction,
  inlineCommentChangeRequestAction,
  mergeChangeRequestAction,
} from "./actions";

type ChangeRequestDetailPageProps = {
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

export default async function ChangeRequestDetailPage({ params, searchParams }: ChangeRequestDetailPageProps) {
  const { org, repo, number } = await params;
  const crNumber = Number(number);
  const view = await getChangeRequestDetail(org, repo, crNumber);

  if (!view) {
    notFound();
  }

  const queryParams = await searchParams;
  const error = getSearchParamValue(queryParams.error);

  const stateLabel = view.state === "merged" ? "Merged" : view.state === "draft" ? "Draft" : "Open";
  const approvalsMet = view.approvals >= view.requiredApprovals;
  const canMerge = view.state !== "merged" && approvalsMet;
  const crBase = `/${org}/${repo}/cr/${view.number}`;

  const approve = approveChangeRequestAction.bind(null, org, repo, crNumber);
  const merge = mergeChangeRequestAction.bind(null, org, repo, crNumber);
  const comment = commentChangeRequestAction.bind(null, org, repo, crNumber);
  const inlineComment = inlineCommentChangeRequestAction.bind(null, org, repo, crNumber);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="cr" />
      </section>

      <header>
        <h1 style={{ marginBottom: "0.5rem" }}>
          {view.title} <span className="muted" style={{ fontWeight: 400 }}>!{view.number}</span>
        </h1>
        <div className="meta-row">
          <span className={`pill ${view.state === "merged" ? "success-pill" : ""}`} style={view.state === "merged" ? { color: "var(--done)" } : {}}>
            {stateLabel}
          </span>
          <span className="muted">
            <strong>{view.author}</strong> wants to merge{" "}
            <code>{view.sourceBranch}</code> into <code>{view.targetBranch}</code>
          </span>
        </div>
      </header>

      {error ? <p className="error-text">{error}</p> : null}

      <div className="detail-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <article className="comment-card">
            <div className="meta-row">
              <Avatar name={view.author} />
              <strong>{view.author}</strong>
              <span className="muted">opened on {formatDateTime(view.createdAt)}</span>
            </div>
            <RichText org={org} repo={repo} text={view.body} />
          </article>

          {/* Conversation: reviews + comments */}
          {view.reviews.map((review, index) => (
            <article key={`${review.reviewer}-${index}`} className="comment-card">
              <div className="meta-row">
                <Avatar name={review.reviewer} />
                <strong>{review.reviewer}</strong>
                <span className={`pill ${review.state === "approved" ? "success-pill" : ""}`}>{review.state}</span>
                <span className="muted">{formatDateTime(review.createdAt)}</span>
              </div>
              {review.body ? <RichText org={org} repo={repo} text={review.body} /> : null}
            </article>
          ))}

          {view.comments.map((comment, index) => (
            <article key={`comment-${index}`} className="comment-card">
              <div className="meta-row">
                <Avatar name={comment.author} />
                <strong>{comment.author}</strong>
                <span className="muted">{formatDateTime(comment.createdAt)}</span>
              </div>
              <RichText org={org} repo={repo} text={comment.body} />
            </article>
          ))}

          {/* Inline review threads */}
          {view.inlineThreads.length > 0 ? (
            <article className="panel">
              <h3>Inline review threads</h3>
              <div className="thread-list top-gap-sm">
                {view.inlineThreads.map((thread, threadIndex) => (
                  <div key={`${thread.filePath}-${thread.line}-${threadIndex}`} className="thread-card">
                    <div className="meta-row">
                      <code style={{ fontSize: "0.8rem" }}>{thread.filePath}:{thread.line}</code>
                      <span className={`pill ${thread.resolved ? "success-pill" : ""}`}>{thread.resolved ? "resolved" : "open"}</span>
                    </div>
                    {thread.comments.map((comment, commentIndex) => (
                      <div key={commentIndex} style={{ padding: "0 1rem 0.75rem" }}>
                        <div className="meta-row muted" style={{ fontSize: "0.82rem" }}>
                          <span>{comment.author}</span>
                          <span>{formatDateTime(comment.createdAt)}</span>
                        </div>
                        <RichText org={org} repo={repo} text={comment.body} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </article>
          ) : null}

          {/* Merge box */}
          <div className="merge-box">
            <div className="merge-status">
              <span className={`merge-dot ${approvalsMet ? "ok" : "warn"}`} />
              <div style={{ flex: 1 }}>
                <strong>Review approvals</strong>
                <div className="muted" style={{ fontSize: "0.85rem" }}>{view.approvals} of {view.requiredApprovals} required approvals</div>
              </div>
            </div>
            <div className="merge-actions">
              {view.state === "merged" ? (
                <p className="success-text" style={{ margin: 0 }}>
                  ✓ This change request was merged{view.mergedAt ? ` on ${formatDateTime(view.mergedAt)}` : ""}.
                </p>
              ) : (
                <>
                  <div className="meta-row">
                    <form action={approve}>
                      <button className="button-secondary" type="submit">Approve</button>
                    </form>
                    {view.baseRevision && view.headRevision ? (
                      <Link className="button-secondary" href={`/${org}/${repo}/diff/${view.baseRevision}/${view.headRevision}`}>View diff</Link>
                    ) : null}
                    {canMerge ? (
                      <form action={merge}>
                        <button className="button" type="submit">Merge change request</button>
                      </form>
                    ) : (
                      <span className="button button-disabled">Merge blocked</span>
                    )}
                  </div>
                  {!canMerge ? (
                    <p className="muted top-gap-sm" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                      Merging requires {view.requiredApprovals} approval(s) per branch protection.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Comment + inline forms */}
          <article className="panel">
            <h3>Add a review comment</h3>
            <form className="form-grid" action={comment}>
              <div className="field">
                <textarea name="commentBody" placeholder="Summarize the review and reference follow-up issues like #14." rows={4} required />
              </div>
              <div className="meta-row" style={{ justifyContent: "flex-end" }}>
                <button className="button" type="submit">Comment</button>
              </div>
            </form>
            <div className="section-divider top-gap" />
            <h3 className="top-gap-sm">Comment on a specific line</h3>
            <form className="form-grid" action={inlineComment}>
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="inlinePath">File path</label>
                  <input id="inlinePath" name="inlinePath" placeholder="Source/LoreHub/HUD.cpp" type="text" required />
                </div>
                <div className="field">
                  <label htmlFor="inlineLine">Line</label>
                  <input id="inlineLine" name="inlineLine" defaultValue="1" type="number" min="1" />
                </div>
              </div>
              <div className="field">
                <textarea name="inlineComment" placeholder="Comment directly on the diff with @mentions or cross-references." rows={3} required />
              </div>
              <div className="meta-row" style={{ justifyContent: "flex-end" }}>
                <button className="button-secondary" type="submit">Add inline comment</button>
              </div>
            </form>
          </article>
        </div>

        <aside>
          <div className="sidebar-block">
            <h4>Reviewers</h4>
            {view.reviewers.length === 0 ? <span className="muted">None requested</span> : view.reviewers.map((reviewer) => (
              <div key={reviewer} className="meta-row">
                <Avatar name={reviewer} />
                <span>{reviewer}</span>
              </div>
            ))}
          </div>
          <div className="sidebar-block">
            <h4>Labels</h4>
            <div className="meta-row">
              {view.labels.length === 0 ? <span className="muted">None</span> : view.labels.map((label) => (
                <span key={label} className="label" style={labelStyle(label)}>{label}</span>
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <h4>Linked issues</h4>
            <div className="stack-links">
              {view.linkedIssues.length === 0 ? <span className="muted">None</span> : view.linkedIssues.map((issueNumber) => (
                <Link key={issueNumber} href={`/${org}/${repo}/issues/${issueNumber}`}>#{issueNumber}</Link>
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <h4>Revisions</h4>
            <div className="muted" style={{ fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}>
              {view.baseRevision ? <>base {view.baseRevision.slice(0, 7)}<br /></> : null}
              {view.headRevision ? <>head {view.headRevision.slice(0, 7)}</> : null}
              {view.mergeRevision ? <><br />merge {view.mergeRevision.slice(0, 7)}</> : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
