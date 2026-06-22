import Link from "next/link";

const features = [
  {
    title: "Binary-first version control",
    body: "Built on Lore's content-addressed, chunked storage. Textures, audio, and 3D assets are first-class — not an LFS afterthought.",
  },
  {
    title: "Change requests, not just diffs",
    body: "Review code and binary assets side by side. Image pixel diffs, audio waveforms, size and chunk deltas, inline threads, and approval gates.",
  },
  {
    title: "CI/CD wired to revisions",
    body: "Pipeline-as-code triggered on push, change request, or tag. Sparse checkouts mean runners fetch only what a job needs.",
  },
  {
    title: "Game-asset tooling",
    body: "Asset browser with type filters, metadata, previews, and duplicate detection across repositories via BLAKE3 content hashes.",
  },
  {
    title: "File locking & obliteration",
    body: "Native lock management for un-mergeable binaries, plus a GDPR/DMCA-ready obliteration workflow that preserves the revision chain.",
  },
  {
    title: "Self-host or cloud",
    body: "Community Edition is free forever via Docker Compose. Enterprise adds SSO, LDAP, and clustering. Or run it managed on LoreHub Cloud.",
  },
];

const comparisons = [
  { competitor: "vs. GitHub", point: "Native binary chunking and asset previews instead of bolt-on LFS." },
  { competitor: "vs. GitLab", point: "Same self-host CE/EE model, applied to a binary-first VCS." },
  { competitor: "vs. Perforce", point: "Open protocol, BLAKE3 integrity, and free Community Edition." },
];

export default function HomePage() {
  return (
    <>
      <main className="shell hero">
        <span className="eyebrow">GitHub for Lore · binary-first VCS</span>
        <div className="hero-grid">
          <section>
            <h1 style={{ fontSize: "2.4rem", lineHeight: 1.1, marginTop: 0 }}>
              Collaboration built for game-scale repositories.
            </h1>
            <p className="muted" style={{ fontSize: "1.1rem", maxWidth: "46ch" }}>
              LoreHub is the self-hostable platform for{" "}
              <Link href="https://github.com/EpicGames/lore" className="inline-link">
                Lore
              </Link>
              , Epic Games&apos; content-addressed version control system. Repositories, change requests,
              CI/CD, and asset tooling — for teams who ship textures, audio, and 3D, not just text.
            </p>
            <div className="cta-row">
              <Link className="button" href="/acme/demo">
                Open the demo repository
              </Link>
              <Link className="button-secondary" href="/explore">
                Explore public repos
              </Link>
            </div>
            <div className="stats">
              <div className="stat">
                <strong>BLAKE3</strong>
                <span className="muted">Cryptographic content addressing</span>
              </div>
              <div className="stat">
                <strong>0 egress</strong>
                <span className="muted">On Cloudflare R2 storage</span>
              </div>
              <div className="stat">
                <strong>AGPL</strong>
                <span className="muted">Open-source Community Edition</span>
              </div>
            </div>
          </section>
          <section className="panel" aria-label="Quick start" style={{ alignSelf: "start" }}>
            <h2 style={{ fontSize: "0.95rem" }}>Push your first revision</h2>
            <p className="muted" style={{ fontSize: "0.9rem" }}>
              Authenticate with a short-lived, partition-scoped token and push with the Lore CLI.
            </p>
            <pre className="terminal-block">
{`# Authenticate against your LoreHub server
lore auth login https://lorehub.example.com

# Clone a partition (sparse by default)
lore clone acme/demo

# Stage assets and push a new revision
lore add Content/Characters/Hero.uasset
lore commit -m "Update hero mesh"
lore push origin main`}
            </pre>
            <Link className="button-secondary" href="/acme/demo/push" style={{ marginTop: "0.85rem" }}>
              Full push guide →
            </Link>
          </section>
        </div>
      </main>

      <section className="shell" style={{ paddingBottom: "1rem" }}>
        <div className="section-header">
          <div>
            <h2>Everything a binary-first team needs</h2>
            <p className="muted">One platform from first revision to shipped build.</p>
          </div>
        </div>
        <div className="grid three top-gap">
          {features.map((feature) => (
            <article key={feature.title} className="panel">
              <h3>{feature.title}</h3>
              <p className="muted" style={{ marginBottom: 0 }}>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell page">
        <div className="panel">
          <div className="section-header">
            <h2>Why teams switch to LoreHub</h2>
          </div>
          <div className="grid three top-gap">
            {comparisons.map((row) => (
              <div key={row.competitor} className="stat">
                <strong style={{ fontSize: "1rem", marginBottom: "0.35rem" }}>{row.competitor}</strong>
                <span className="muted">{row.point}</span>
              </div>
            ))}
          </div>
          <div className="cta-row">
            <Link className="button" href="/explore">Get started free</Link>
            <Link className="button-secondary" href="/admin/enterprise/auth">Enterprise &amp; SSO</Link>
          </div>
        </div>
      </section>
    </>
  );
}
