import Link from "next/link";

import { AdminTabs } from "@/components/admin-tabs";
import { enterpriseProviders } from "@/lib/demo-enterprise";

export default function EnterpriseAuthPage() {
  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="auth" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>SAML &amp; OIDC</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Self-hosted teams can use SAML 2.0 and OIDC without changing the core login routes.</p>
        </div>
        <button className="button" type="button">Add provider</button>
      </div>

      <section className="grid two">
        {enterpriseProviders.map((provider) => (
          <article key={provider.id} className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="meta-row" style={{ justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{provider.name}</h2>
              <span className={`pill ${provider.status === "active" ? "success-pill" : "accent-pill"}`}>{provider.status}</span>
            </div>
            <div className="meta-row">
              <span className="pill muted-pill">{provider.protocol}</span>
              <span className="muted" style={{ fontSize: "0.85rem" }}>{provider.domain}</span>
            </div>
            <div className="metadata-list">
              {provider.details.map((detail) => (
                <div key={detail} className="metadata-row">
                  <span className="muted">·</span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
            <div className="meta-row">
              <Link className="button-secondary" href={`/sso?provider=${provider.id}`}>Test sign-in flow</Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
