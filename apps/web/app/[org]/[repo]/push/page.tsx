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
      <section className="panel">
        <div className="repo-path">{org} / {repo}</div>
        <h1>Push with the Lore CLI</h1>
        <p className="muted">
          LoreHub issues the repository token and server URL, while creators continue to push through the native Lore CLI flow.
        </p>
        <div className="instruction-list">
          <div className="panel">
            <h2>1. Mint a scoped token</h2>
            <pre className="terminal-block"><code>{`curl -X POST http://localhost:8080/api/v1/repositories/:id/lore-token \\
  -H "content-type: application/json" \\
  -d '{"permission":"write","subject":"${org}/${repo}"}'`}</code></pre>
          </div>
          <div className="panel">
            <h2>2. Point the Lore CLI at the server</h2>
            <pre className="terminal-block"><code>{`export LORE_SERVER_URL=http://localhost:8081
export LORE_TOKEN=<minted-token>`}</code></pre>
          </div>
          <div className="panel">
            <h2>3. Push your branch</h2>
            <pre className="terminal-block"><code>{`lore remote add lorehub "$LORE_SERVER_URL"
lore push lorehub main`}</code></pre>
          </div>
        </div>
      </section>
    </main>
  );
}
