import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { applyChangeRequestActions, getChangeRequest, getUser } from "@/lib/demo-collaboration";
import { getPipelineGate } from "@/lib/demo-pipelines";
import { formatDateTime, labelStyle } from "@/lib/format";
import { RichText } from "@/lib/render-rich-text";
import { getSearchParamValue } from "@/lib/search-params";

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
  const queryParams = await searchParams;
  const changeRequest = getChangeRequest(Number(number));

  if (!changeRequest) {
    notFound();
  }

  const requestedReview = getSearchParamValue(queryParams.review);
  const preMergeView = applyChangeRequestActions(changeRequest, {
    review: requestedReview === "approve" ? "approve" : undefined,
    commentBody: getSearchParamValue(queryParams.commentBody),
    inlineComment: getSearchParamValue(queryParams.inlineComment),
    inlinePath: getSearchParamValue(queryParams.inlinePath),
    inlineLine: getSearchParamValue(queryParams.inlineLine),
  });
  const preMergeApprovals = preMergeView.reviews.filter((review) => review.state === "approved").length;
  const gate = getPipelineGate(changeRequest.number, preMergeApprovals);
  const mergeBlocked = requestedReview === "merge" && !gate.canMerge;
  const view = requestedReview === "merge" && gate.canMerge
    ? applyChangeRequestActions(changeRequest, { review: "merge" })
    : preMergeView;
  const author = getUser(view.author);
  const approvals = view.reviews.filter((review) => review.state === "approved").length;
  const stateLabel = view.state === "merged" ? "Merged" : view.state === "draft" ? "Draft" : "Open";
  const crBase = `/${org}/${repo}/cr/${view.number}`;

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
            <strong>{author?.name ?? view.author}</strong> wants to merge{" "}
            <code>{view.sourceBranch}</code> into <code>{view.targetBranch}</code>
          </span>
        </div>
      </header>

      <div className="detail-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <article className="comment-card">
            <div className="meta-row">
              <Avatar name={author?.name ?? view.author} />
              <strong>{author?.name ?? view.author}</strong>
              <span className="muted">opened on {formatDateTime(view.createdAt)}</span>
            </div>
            <RichText org={org} repo={repo} text={view.body} />
          </article>

          {/* Conversation: reviews + comments */}
          {view.reviews.map((review, index) => (
            <article key={`${review.reviewer}-${index}`} className="comment-card">
              <div className="meta-row">
                <Avatar name={getUser(review.reviewer)?.name ?? review.reviewer} />
                <strong>{getUser(review.reviewer)?.name ?? review.reviewer}</strong>
                <span className={`pill ${review.state === "approved" ? "success-pill" : ""}`}>{review.state}</span>
                <span className="muted">{formatDateTime(review.createdAt)}</span>
              </div>
              <RichText org={org} repo={repo} text={review.body} />
            </article>
          ))}

          {view.comments.map((comment) => (
            <article key={comment.id} className="comment-card">
              <div className="meta-row">
                <Avatar name={getUser(comment.author)?.name ?? comment.author} />
                <strong>{getUser(comment.author)?.name ?? comment.author}</strong>
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
                {view.inlineThreads.map((thread) => (
                  <div key={thread.id} className="thread-card">
                    <div className="meta-row">
                      <code style={{ fontSize: "0.8rem" }}>{thread.filePath}:{thread.line}</code>
                      <span className={`pill ${thread.status === "resolved" ? "success-pill" : ""}`}>{thread.status}</span>
                    </div>
                    {thread.comments.map((comment) => (
                      <div key={comment.id} style={{ padding: "0 1rem 0.75rem" }}>
                        <div className="meta-row muted" style={{ fontSize: "0.82rem" }}>
                          <span>{getUser(comment.author)?.name ?? comment.author}</span>
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
              <span className={`merge-dot ${gate.run ? (gate.run.status === "passed" ? "ok" : gate.run.status === "failed" ? "fail" : "warn") : "muted"}`} />
              <div style={{ flex: 1 }}>
                <strong>
                  {gate.run ? `Pipeline ${gate.run.id}` : "No pipeline linked"}
                  {gate.run ? ` — ${gate.run.status}` : ""}
                </strong>
                {gate.run ? (
                  <div className="muted" style={{ fontSize: "0.85rem" }}>
                    <Link href={`/${org}/${repo}/pipelines/${gate.run.id}`}>View run details</Link>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="merge-status">
              <span className={`merge-dot ${approvals >= gate.approvalsRequired ? "ok" : "warn"}`} />
              <div style={{ flex: 1 }}>
                <strong>Review approvals</strong>
                <div className="muted" style={{ fontSize: "0.85rem" }}>{approvals} of {gate.approvalsRequired} required approvals</div>
              </div>
            </div>
            <div className="merge-actions">
              {view.state === "merged" ? (
                <p className="success-text" style={{ margin: 0 }}>✓ This change request was merged.</p>
              ) : (
                <>
                  <div className="meta-row">
                    <Link className="button-secondary" href={`${crBase}?review=approve`}>Approve</Link>
                    <Link className="button-secondary" href={`/${org}/${repo}/diff/${view.baseRevision}/${view.headRevision}`}>View diff</Link>
                    {gate.canMerge ? (
                      <Link className="button" href={`${crBase}?review=merge`}>Merge change request</Link>
                    ) : (
                      <span className="button button-disabled">Merge blocked</span>
                    )}
                  </div>
                  {mergeBlocked || !gate.canMerge ? (
                    <p className="muted top-gap-sm" style={{ margin: "0.5rem 0 0", fontSize: "0.85rem" }}>
                      Merging requires a green pipeline and {gate.approvalsRequired} approval(s) per branch protection.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </div>

          {/* Comment + inline forms */}
          <article className="panel">
            <h3>Add a review comment</h3>
            <form className="form-grid" method="get">
              <div className="field">
                <textarea name="commentBody" placeholder="Summarize the review and reference follow-up issues like #14." rows={4} />
              </div>
              <div className="meta-row" style={{ justifyContent: "flex-end" }}>
                <button className="button" type="submit">Comment</button>
              </div>
            </form>
            <div className="section-divider top-gap" />
            <h3 className="top-gap-sm">Comment on a specific line</h3>
            <form className="form-grid" method="get">
              <div className="split-fields">
                <div className="field">
                  <label htmlFor="inlinePath">File path</label>
                  <input id="inlinePath" name="inlinePath" defaultValue="Source/LoreHub/HUD.cpp" type="text" />
                </div>
                <div className="field">
                  <label htmlFor="inlineLine">Line</label>
                  <input id="inlineLine" name="inlineLine" defaultValue="4" type="text" />
                </div>
              </div>
              <div className="field">
                <textarea name="inlineComment" placeholder="Comment directly on the diff with @mentions or cross-references." rows={3} />
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
                <Avatar name={getUser(reviewer)?.name ?? reviewer} />
                <span>{getUser(reviewer)?.name ?? reviewer}</span>
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
              base {view.baseRevision.slice(0, 7)}<br />head {view.headRevision.slice(0, 7)}
              {view.mergeRevision ? <><br />merge {view.mergeRevision.slice(0, 7)}</> : null}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
