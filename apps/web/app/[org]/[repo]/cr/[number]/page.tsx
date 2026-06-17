import Link from "next/link";
import { notFound } from "next/navigation";

import { applyChangeRequestActions, getChangeRequest, getUser } from "@/lib/demo-collaboration";
import { getPipelineGate } from "@/lib/demo-pipelines";
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

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>!{view.number} {view.title}</h1>
          </div>
          <span className={`pill ${view.state === "merged" ? "success-pill" : view.state === "draft" ? "muted-pill" : "accent-pill"}`}>
            {view.state}
          </span>
        </div>
        <div className="meta-row muted">
          <span>{author?.name ?? view.author}</span>
          <span>{view.sourceBranch} {"->"} {view.targetBranch}</span>
          <span>{approvals} approvals</span>
        </div>
        <RichText org={org} repo={repo} text={view.body} />
        <div className="cta-row compact">
          <Link className="button-secondary" href={`/${org}/${repo}/cr/${view.number}?review=approve`}>
            Approve
          </Link>
          {gate.canMerge ? (
            <Link className="button-secondary" href={`/${org}/${repo}/cr/${view.number}?review=merge`}>
              Merge
            </Link>
          ) : (
            <span className="button-secondary button-disabled">Merge blocked</span>
          )}
          <Link className="button-secondary" href={`/${org}/${repo}/diff/${view.baseRevision}/${view.headRevision}`}>
            Open diff
          </Link>
        </div>
        <div className="panel gate-panel top-gap">
          <h2>CI status gate</h2>
          <ul className="list">
            <li>Approvals: {approvals} / {gate.approvalsRequired}</li>
            <li>Pipeline: {gate.run ? `${gate.run.id} (${gate.run.status})` : "No pipeline run linked"}</li>
            <li>Merge allowed: {gate.canMerge ? "yes" : "no"}</li>
          </ul>
          {gate.run ? (
            <Link className="button-secondary top-gap-sm" href={`/${org}/${repo}/pipelines/${gate.run.id}`}>
              Open pipeline run
            </Link>
          ) : null}
          {mergeBlocked ? <p className="error-text top-gap-sm">Merge is blocked until the pipeline is green and approvals reach the branch protection threshold.</p> : null}
        </div>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Review summary</h2>
          <div className="comment-thread">
            {view.reviews.map((review, index) => (
              <article key={`${review.reviewer}-${index}`} className="comment-card">
                <div className="meta-row muted">
                  <span>{getUser(review.reviewer)?.name ?? review.reviewer}</span>
                  <span>{review.state}</span>
                  <span>{review.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
                </div>
                <RichText org={org} repo={repo} text={review.body} />
              </article>
            ))}
          </div>

          <div className="top-gap">
            <h2>General discussion</h2>
            <div className="comment-thread">
              {view.comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <div className="meta-row muted">
                    <span>{getUser(comment.author)?.name ?? comment.author}</span>
                    <span>{comment.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
                  </div>
                  <RichText org={org} repo={repo} text={comment.body} />
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="panel form-card">
          <h2>Inline threads</h2>
          <div className="thread-list">
            {view.inlineThreads.map((thread) => (
              <article key={thread.id} className="thread-card">
                <div className="meta-row">
                  <span className="pill muted-pill">{thread.filePath}</span>
                  <span className="pill muted-pill">Line {thread.line}</span>
                  <span className={`pill ${thread.status === "resolved" ? "success-pill" : "accent-pill"}`}>{thread.status}</span>
                </div>
                {thread.comments.map((comment) => (
                  <div key={comment.id} className="top-gap-sm">
                    <div className="meta-row muted">
                      <span>{getUser(comment.author)?.name ?? comment.author}</span>
                      <span>{comment.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
                    </div>
                    <RichText org={org} repo={repo} text={comment.body} />
                  </div>
                ))}
              </article>
            ))}
          </div>
          <form className="form-grid top-gap" method="get">
            <div className="field">
              <label htmlFor="commentBody">Review comment</label>
              <textarea id="commentBody" name="commentBody" placeholder="Summarize the review result and reference any follow-up issues." rows={4} />
            </div>
            <button className="button-secondary" type="submit">
              Post review comment
            </button>
          </form>
          <form className="form-grid top-gap" method="get">
            <div className="field split-fields">
              <div>
                <label htmlFor="inlinePath">File path</label>
                <input id="inlinePath" name="inlinePath" defaultValue="Source/LoreHub/HUD.cpp" type="text" />
              </div>
              <div>
                <label htmlFor="inlineLine">Line</label>
                <input id="inlineLine" name="inlineLine" defaultValue="4" type="text" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="inlineComment">Inline comment</label>
              <textarea id="inlineComment" name="inlineComment" placeholder="Comment directly on the diff with @mentions or cross-references." rows={4} />
            </div>
            <button className="button" type="submit">
              Add inline comment
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}
