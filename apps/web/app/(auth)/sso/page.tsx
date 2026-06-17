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
    <main className="shell page">
      <section className="panel form-card">
        <div className="eyebrow">Enterprise SSO</div>
        <h1>{provider.name}</h1>
        <p className="muted">
          This route models the enterprise login handoff for {provider.protocol} providers and gives the app a stable callback-oriented sign-in surface.
        </p>
        <div className="comment-card top-gap-sm">
          <div className="meta-row">
            <span className="pill">{provider.protocol}</span>
            <span className={`pill ${provider.status === "active" ? "success-pill" : "accent-pill"}`}>{provider.status}</span>
          </div>
          <p className="muted">Domain: {provider.domain}</p>
          <ul className="list">
            {provider.details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
        <div className="cta-row compact">
          <Link className="button" href="/acme/demo">
            Continue as enterprise user
          </Link>
          <Link className="button-secondary" href="/login">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}
