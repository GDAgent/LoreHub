import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { buildCreatedChangeRequest, getUser, listChangeRequests } from "@/lib/demo-collaboration";
import { formatDate, labelStyle } from "@/lib/format";
import { getSearchParamValue } from "@/lib/search-params";

type ChangeRequestsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function stateMeta(state: string) {
  if (state === "merged") return { cls: "state-merged", label: "Merged", icon: <MergeIcon /> };
  if (state === "draft") return { cls: "state-draft", label: "Draft", icon: <DraftIcon /> };
  return { cls: "state-open", label: "Open", icon: <OpenPrIcon /> };
}

export default async function ChangeRequestsPage({ params, searchParams }: ChangeRequestsPageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q)?.trim();
  const state = getSearchParamValue(queryParams.state) ?? "open";
  const title = getSearchParamValue(queryParams.title);
  const body = getSearchParamValue(queryParams.body);
  const sourceBranch = getSearchParamValue(queryParams.sourceBranch) ?? "feature/new-work";
  const targetBranch = getSearchParamValue(queryParams.targetBranch) ?? "main";

  const createdChangeRequest = title?.trim() && body?.trim()
    ? buildCreatedChangeRequest({ title, body, sourceBranch, targetBranch })
    : null;

  const all = listChangeRequests({ query });
  const counts = {
    open: all.filter((cr) => cr.state === "open").length,
    draft: all.filter((cr) => cr.state === "draft").length,
    merged: all.filter((cr) => cr.state === "merged").length,
  };
  const changeRequests = state === "all" ? all : all.filter((cr) => cr.state === state);
  const visible = createdChangeRequest ? [createdChangeRequest, ...changeRequests] : changeRequests;
  const base = `/${org}/${repo}/cr`;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="cr" />
      </section>

      {createdChangeRequest ? (
        <p className="success-text">✓ Opened !{createdChangeRequest.number}: {createdChangeRequest.title}</p>
      ) : null}

      <section style={{ display: "grid", gap: "0.75rem" }}>
        <div className="meta-row" style={{ justifyContent: "space-between" }}>
          <form method="get" style={{ flex: 1, maxWidth: 520 }}>
            <div className="field">
              <input name="q" defaultValue={query} placeholder="Search change requests" type="search" />
            </div>
          </form>
          <details>
            <summary className="button" style={{ listStyle: "none" }}>New change request</summary>
            <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(460px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
              <h3>Open change request</h3>
              <form className="form-grid" method="get">
                <div className="field">
                  <label htmlFor="title">Title</label>
                  <input id="title" name="title" placeholder="Promote checkpoint HUD refinements" type="text" required />
                </div>
                <div className="split-fields">
                  <div className="field">
                    <label htmlFor="sourceBranch">Source</label>
                    <input id="sourceBranch" name="sourceBranch" placeholder="feature/checkpoint-hud" type="text" />
                  </div>
                  <div className="field">
                    <label htmlFor="targetBranch">Target</label>
                    <input id="targetBranch" name="targetBranch" placeholder="main" type="text" />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="body">Description</label>
                  <textarea id="body" name="body" placeholder="Reference #12 or !7, mention @reviewers, explain the merge plan." rows={5} required />
                </div>
                <button className="button" type="submit">Create change request</button>
              </form>
            </div>
          </details>
        </div>

        <div>
          <div className="filter-bar">
            <Link href={`${base}?state=open`} className={state === "open" ? "active" : undefined}><OpenPrIcon /> {counts.open} Open</Link>
            <Link href={`${base}?state=draft`} className={state === "draft" ? "active" : undefined}><DraftIcon /> {counts.draft} Draft</Link>
            <Link href={`${base}?state=merged`} className={state === "merged" ? "active" : undefined}><MergeIcon /> {counts.merged} Merged</Link>
          </div>
          {visible.length === 0 ? (
            <div className="list-rows"><div className="empty-state" style={{ border: "none" }}>No change requests match this filter.</div></div>
          ) : (
            <div className="list-rows">
              {visible.map((cr) => {
                const author = getUser(cr.author);
                const approvals = cr.reviews.filter((r) => r.state === "approved").length;
                const meta = stateMeta(cr.state);
                return (
                  <div key={cr.number} className="list-row">
                    <span className={`list-row-icon ${meta.cls}`}>{meta.icon}</span>
                    <div className="list-row-main">
                      <div className="list-row-title">
                        <Link href={`/${org}/${repo}/cr/${cr.number}`}>{cr.title}</Link>
                        {cr.labels.map((label) => (
                          <span key={label} className="label" style={{ ...labelStyle(label), marginLeft: "0.4rem" }}>{label}</span>
                        ))}
                      </div>
                      <div className="list-row-meta">
                        <span>!{cr.number}</span>
                        <span>{author?.name ?? cr.author} wants to merge <code style={{ fontSize: "0.8em" }}>{cr.sourceBranch}</code> → <code style={{ fontSize: "0.8em" }}>{cr.targetBranch}</code></span>
                        <span>· opened {formatDate(cr.createdAt)}</span>
                        {approvals > 0 ? <span>· ✓ {approvals} approved</span> : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function OpenPrIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M6 9v6M15 6h2a2 2 0 0 1 2 2v7" />
      <circle cx="19" cy="18" r="0.5" fill="currentColor" />
    </svg>
  );
}

function MergeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="9" r="3" />
      <path d="M6 9v6M18 12a6 6 0 0 1-6 6h-0.5" />
    </svg>
  );
}

function DraftIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M6 9v6" />
      <circle cx="18" cy="18" r="3" strokeDasharray="2 2" />
    </svg>
  );
}
