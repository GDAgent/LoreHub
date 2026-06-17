import Link from "next/link";

import { buildCreatedChangeRequest, getUser, listChangeRequests } from "@/lib/demo-collaboration";
import { getSearchParamValue } from "@/lib/search-params";

type ChangeRequestsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ChangeRequestsPage({ params, searchParams }: ChangeRequestsPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q)?.trim();
  const state = getSearchParamValue(queryParams.state) ?? "all";
  const title = getSearchParamValue(queryParams.title);
  const body = getSearchParamValue(queryParams.body);
  const sourceBranch = getSearchParamValue(queryParams.sourceBranch) ?? "feature/new-work";
  const targetBranch = getSearchParamValue(queryParams.targetBranch) ?? "main";

  const createdChangeRequest = title?.trim() && body?.trim()
    ? buildCreatedChangeRequest({ title, body, sourceBranch, targetBranch })
    : null;

  const changeRequests = listChangeRequests({ query, state });
  const visibleChangeRequests = createdChangeRequest ? [createdChangeRequest, ...changeRequests] : changeRequests;

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>Change Requests</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/issues`}>
              View issues
            </Link>
          </div>

          <form className="toolbar-grid" method="get">
            <input defaultValue={query} name="q" placeholder="Search change requests" type="text" />
            <input defaultValue={state === "all" ? "" : state} name="state" placeholder="open, draft, merged" type="text" />
            <button className="button-secondary" type="submit">
              Search
            </button>
          </form>

          <div className="revision-list top-gap">
            {visibleChangeRequests.map((changeRequest) => {
              const author = getUser(changeRequest.author);
              const approvalCount = changeRequest.reviews.filter((review) => review.state === "approved").length;

              return (
                <article key={changeRequest.number} className="revision-card">
                  <div className="section-header">
                    <div>
                      <div className="meta-row">
                        <span className="pill">!{changeRequest.number}</span>
                        <span className={`pill ${changeRequest.state === "merged" ? "success-pill" : changeRequest.state === "draft" ? "muted-pill" : "accent-pill"}`}>
                          {changeRequest.state}
                        </span>
                      </div>
                      <h2>{changeRequest.title}</h2>
                    </div>
                    <Link className="button-secondary" href={`/${org}/${repo}/cr/${changeRequest.number}`}>
                      Open CR
                    </Link>
                  </div>
                  <p className="muted">{changeRequest.body}</p>
                  <div className="meta-row muted">
                    <span>{author?.name ?? changeRequest.author}</span>
                    <span>{changeRequest.sourceBranch} {"->"} {changeRequest.targetBranch}</span>
                    <span>{approvalCount} approvals</span>
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Open change request</h2>
          <p className="muted">
            Open, review, approve, and merge flows all live in the Phase 2 collaboration shell.
          </p>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" placeholder="Promote checkpoint HUD refinements" type="text" />
            </div>
            <div className="field split-fields">
              <div>
                <label htmlFor="sourceBranch">Source branch</label>
                <input id="sourceBranch" name="sourceBranch" placeholder="feature/checkpoint-hud" type="text" />
              </div>
              <div>
                <label htmlFor="targetBranch">Target branch</label>
                <input id="targetBranch" name="targetBranch" placeholder="main" type="text" />
              </div>
            </div>
            <div className="field">
              <label htmlFor="body">Description</label>
              <textarea id="body" name="body" placeholder="Reference #12 or !7, mention @reviewers, and explain the merge plan." rows={6} />
            </div>
            <button className="button" type="submit">
              Open change request
            </button>
          </form>
          {createdChangeRequest ? (
            <p className="success-text">Opened !{createdChangeRequest.number}: {createdChangeRequest.title}</p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
