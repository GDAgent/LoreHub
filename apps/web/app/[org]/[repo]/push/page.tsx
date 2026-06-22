import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";

type PushPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function PushPage({ params }: PushPageProps) {
  const { org, repo } = await params;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="code" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Push with the Lore CLI</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0", maxWidth: "60ch" }}>
            LoreHub issues the repository token and server URL; you push through the native Lore CLI flow.
          </p>
        </div>
      </div>

      <div className="detail-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <article className="panel">
            <div className="meta-row" style={{ marginBottom: "0.5rem" }}>
              <span className="step-badge">1</span>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Mint a scoped token</h2>
            </div>
            <pre className="terminal-block"><code>{`curl -X POST http://localhost:8080/api/v1/repositories/:id/lore-token \\
  -H "content-type: application/json" \\
  -d '{"permission":"write","subject":"${org}/${repo}"}'`}</code></pre>
          </article>

          <article className="panel">
            <div className="meta-row" style={{ marginBottom: "0.5rem" }}>
              <span className="step-badge">2</span>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Point the Lore CLI at the server</h2>
            </div>
            <pre className="terminal-block"><code>{`export LORE_SERVER_URL=http://localhost:8081
export LORE_TOKEN=<minted-token>`}</code></pre>
          </article>

          <article className="panel">
            <div className="meta-row" style={{ marginBottom: "0.5rem" }}>
              <span className="step-badge">3</span>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Push your branch</h2>
            </div>
            <pre className="terminal-block"><code>{`lore remote add lorehub "$LORE_SERVER_URL"
lore push lorehub main`}</code></pre>
          </article>
        </div>

        <aside className="panel">
          <h3 style={{ marginTop: 0 }}>Notes</h3>
          <ul className="list">
            <li>Tokens are scoped to <code>{org}/{repo}</code> and the permission you request.</li>
            <li>Write tokens expire; mint a fresh one for each automation run.</li>
            <li>Binary chunks dedupe server-side — only changed content uploads.</li>
            <li>Pushes to protected branches still require an approved change request.</li>
          </ul>
          <Link className="button-secondary" href={`/${org}/${repo}/branches`}>View branches</Link>
        </aside>
      </div>
    </main>
  );
}
