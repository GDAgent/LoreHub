import Link from "next/link";

import { enterpriseProviders } from "@/lib/demo-enterprise";

export default function EnterpriseAuthPage() {
  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">admin / enterprise</div>
        <h1>SAML and OIDC</h1>
        <p className="muted">
          Enterprise auth providers are managed here so self-hosted teams can use SAML 2.0 and OIDC without changing the core login routes.
        </p>
        <div className="stack-links top-gap-sm inline-stack">
          <Link href="/admin/enterprise/directory">LDAP sync</Link>
          <Link href="/admin/enterprise/audit">Audit log</Link>
          <Link href="/admin/enterprise/sla">SLA dashboard</Link>
        </div>
      </section>

      <section className="grid two top-gap">
        {enterpriseProviders.map((provider) => (
          <article key={provider.id} className="panel">
            <div className="meta-row">
              <span className="pill">{provider.protocol}</span>
              <span className={`pill ${provider.status === "active" ? "success-pill" : "accent-pill"}`}>{provider.status}</span>
            </div>
            <h2>{provider.name}</h2>
            <p className="muted">{provider.domain}</p>
            <ul className="list">
              {provider.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
            <div className="cta-row compact">
              <Link className="button-secondary" href={`/sso?provider=${provider.id}`}>
                Test sign-in flow
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
