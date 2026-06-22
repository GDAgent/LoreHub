import Link from "next/link";

import { getEnterpriseProvider } from "@/lib/demo-enterprise";
import { getSearchParamValue } from "@/lib/search-params";

type SsoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SsoPage({ searchParams }: SsoPageProps) {
  const queryParams = await searchParams;
  const provider = getEnterpriseProvider(getSearchParamValue(queryParams.provider));

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">L</span> LoreHub
        </div>
        <section className="panel" style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div className="eyebrow">Enterprise SSO</div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>{provider.name}</h1>
            <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.9rem" }}>
              Single sign-on handoff for {provider.protocol} via {provider.domain}.
            </p>
          </div>

          <div className="meta-row">
            <span className="pill">{provider.protocol}</span>
            <span className={`pill ${provider.status === "active" ? "success-pill" : "accent-pill"}`}>{provider.status}</span>
          </div>

          <div className="metadata-list">
            {provider.details.map((detail) => (
              <div key={detail} className="metadata-row">
                <span className="muted">·</span>
                <span>{detail}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Link className="button" href="/acme/demo">Continue as enterprise user</Link>
            <Link className="button-secondary" href="/login">Back to sign in</Link>
          </div>
        </section>
        <p className="auth-foot">Identity is verified by your organization&rsquo;s provider.</p>
      </div>
    </div>
  );
}
