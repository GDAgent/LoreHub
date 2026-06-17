import Link from "next/link";

import { buildCreatedIssue, getUser, listIssues } from "@/lib/demo-collaboration";
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
  const state = getSearchParamValue(queryParams.state) ?? "all";
  const label = getSearchParamValue(queryParams.label) ?? "all";
  const title = getSearchParamValue(queryParams.title);
  const body = getSearchParamValue(queryParams.body);
  const labels = getSearchParamValue(queryParams.labels);
  const assignees = getSearchParamValue(queryParams.assignees);

  const createdIssue = title?.trim() && body?.trim()
    ? buildCreatedIssue({ title, body, labels, assignees })
    : null;
  const issues = listIssues({ query, state, label });
  const visibleIssues = createdIssue ? [createdIssue, ...issues] : issues;

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>Issues</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/cr`}>
              View change requests
            </Link>
          </div>

          <form className="toolbar-grid" method="get">
            <input defaultValue={query} name="q" placeholder="Search issues, labels, or body text" type="text" />
            <input defaultValue={state === "all" ? "" : state} name="state" placeholder="open or closed" type="text" />
            <input defaultValue={label === "all" ? "" : label} name="label" placeholder="label name" type="text" />
            <button className="button-secondary" type="submit">
              Search
            </button>
          </form>

          <div className="revision-list top-gap">
            {visibleIssues.map((issue) => {
              const author = getUser(issue.author);

              return (
                <article key={issue.number} className="revision-card">
                  <div className="section-header">
                    <div>
                      <div className="meta-row">
                        <span className="pill">#{issue.number}</span>
                        <span className={`pill ${issue.state === "closed" ? "warn-pill" : "success-pill"}`}>
                          {issue.state}
                        </span>
                      </div>
                      <h2>{issue.title}</h2>
                    </div>
                    <Link className="button-secondary" href={`/${org}/${repo}/issues/${issue.number}`}>
                      Open issue
                    </Link>
                  </div>
                  <p className="muted">{issue.body}</p>
                  <div className="meta-row muted">
                    <span>{author?.name ?? issue.author}</span>
                    <span>{issue.createdAt.replace("T", " ").replace("Z", " UTC")}</span>
                    <span>{issue.comments.length} comments</span>
                  </div>
                  <div className="meta-row top-gap-sm">
                    {issue.labels.map((issueLabel) => (
                      <span key={issueLabel} className="pill muted-pill">
                        {issueLabel}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Create issue</h2>
          <p className="muted">
            Phase 2 supports the full issue loop in the shell: create, search, comment, label, and close.
          </p>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="title">Title</label>
              <input id="title" name="title" placeholder="Texture streaming spikes in hero corridor" type="text" />
            </div>
            <div className="field">
              <label htmlFor="body">Body</label>
              <textarea id="body" name="body" placeholder="Describe the issue, add @mentions, and reference #issues or !change-requests." rows={6} />
            </div>
            <div className="field">
              <label htmlFor="labels">Labels</label>
              <input id="labels" name="labels" placeholder="bug, art, priority:high" type="text" />
            </div>
            <div className="field">
              <label htmlFor="assignees">Assignees</label>
              <input id="assignees" name="assignees" placeholder="@maya, @iris" type="text" />
            </div>
            <button className="button" type="submit">
              Create issue
            </button>
          </form>
          {createdIssue ? (
            <p className="success-text">Created issue #{createdIssue.number}: {createdIssue.title}</p>
          ) : null}
        </article>
      </section>
    </main>
  );
}
