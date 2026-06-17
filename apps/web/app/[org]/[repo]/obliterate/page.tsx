import { buildObliterationView } from "@/lib/demo-assets";
import { getSearchParamValue } from "@/lib/search-params";

type ObliteratePageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ObliteratePage({ params, searchParams }: ObliteratePageProps) {
  const { org, repo } = await params;
  const queryParams = await searchParams;
  const path = getSearchParamValue(queryParams.path);
  const reason = getSearchParamValue(queryParams.reason);
  const requests = buildObliterationView({ path, reason });

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="repo-path">{org} / {repo}</div>
          <h1>Obliteration requests</h1>
          <p className="muted">
            This workflow tracks asset removal requests through request, approval, and execution stages while preserving an audit trail.
          </p>
          <div className="comment-thread top-gap-sm">
            {requests.map((request) => (
              <article key={request.id} className="comment-card">
                <div className="section-header">
                  <div>
                    <div className="meta-row">
                      <span className="pill">{request.id}</span>
                      <span className={`pill ${request.status === "executed" ? "success-pill" : request.status === "approved" ? "accent-pill" : "warn-pill"}`}>
                        {request.status}
                      </span>
                    </div>
                    <p>{request.path}</p>
                  </div>
                  <span className="pill muted-pill">{request.contextId}</span>
                </div>
                <p className="muted">{request.reason}</p>
                <div className="meta-row muted">
                  <span>{request.requestedBy}</span>
                  <span>{request.filedAt.replace("T", " ").replace("Z", " UTC")}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Submit request</h2>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="path">Path</label>
              <input id="path" name="path" placeholder="Content/Secrets/test-api-key.txt" type="text" />
            </div>
            <div className="field">
              <label htmlFor="reason">Reason</label>
              <textarea id="reason" name="reason" placeholder="Accidental secret, GDPR removal, DMCA asset, or other irreversible content issue." rows={6} />
            </div>
            <button className="button" type="submit">
              Submit obliteration request
            </button>
          </form>
          {path?.trim() && reason?.trim() ? <p className="success-text">Submitted new obliteration request for {path}.</p> : null}
        </article>
      </section>
    </main>
  );
}
