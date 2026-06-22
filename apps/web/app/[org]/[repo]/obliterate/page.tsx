import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { buildObliterationView } from "@/lib/demo-assets";
import { getUser } from "@/lib/demo-collaboration";
import { formatDateTime } from "@/lib/format";
import { getSearchParamValue } from "@/lib/search-params";

type ObliteratePageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_PILL: Record<string, string> = {
  executed: "success-pill",
  approved: "accent-pill",
  pending: "warn-pill",
};

export default async function ObliteratePage({ params, searchParams }: ObliteratePageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const path = getSearchParamValue(queryParams.path);
  const reason = getSearchParamValue(queryParams.reason);
  const requests = buildObliterationView({ path, reason });
  const submitted = Boolean(path?.trim() && reason?.trim());

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="locks" />
      </section>

      {submitted ? <p className="success-text">✓ Submitted obliteration request for {path}.</p> : null}

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Obliteration requests</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0", maxWidth: "60ch" }}>
            Permanently remove content from history through a request → approval → execution workflow, preserving an immutable audit trail.
          </p>
        </div>
        <details>
          <summary className="button button-danger" style={{ listStyle: "none" }}>New request</summary>
          <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(480px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
            <h3 style={{ marginTop: 0 }}>Submit request</h3>
            <form className="form-grid" method="get">
              <div className="field">
                <label htmlFor="path">Path</label>
                <input id="path" name="path" placeholder="Content/Secrets/test-api-key.txt" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="reason">Reason</label>
                <textarea id="reason" name="reason" placeholder="Accidental secret, GDPR removal, DMCA asset, or other irreversible content issue." rows={5} required />
              </div>
              <button className="button button-danger" type="submit">Submit obliteration request</button>
            </form>
          </div>
        </details>
      </div>

      <div className="list-rows">
        {requests.map((request) => {
          const requester = getUser(request.requestedBy);
          return (
            <div key={request.id} className="list-row">
              <span className="list-row-icon state-danger"><TrashIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <code style={{ fontSize: "0.85em" }}>{request.path}</code>
                  <span className={`pill ${STATUS_PILL[request.status] ?? "muted-pill"}`} style={{ marginLeft: "0.5rem" }}>{request.status}</span>
                </div>
                <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{request.reason}</p>
                <div className="list-row-meta">
                  <span>{request.id}</span>
                  <span>· {requester?.name ?? request.requestedBy}</span>
                  <span>· filed {formatDateTime(request.filedAt)}</span>
                  <span>· context <code style={{ fontSize: "0.8em" }}>{request.contextId}</code></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14" />
    </svg>
  );
}
