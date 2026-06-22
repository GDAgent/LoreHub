import Link from "next/link";

import { getSearchParamValue } from "@/lib/search-params";

type ExplorePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type ExploreRepo = {
  org: string;
  repo: string;
  description: string;
  topic: string;
  assetMix: string;
  stars: number;
  storage: string;
  updated: string;
};

const REPOS: ExploreRepo[] = [
  { org: "acme", repo: "demo", description: "Reference arena vertical slice — textures, audio, models, and cinematics under binary-first history.", topic: "templates", assetMix: "Mixed assets", stars: 482, storage: "67.6 MB", updated: "2h ago" },
  { org: "nova", repo: "skyforge", description: "Open-world streaming sandbox with sparse checkout and partition-scoped CI.", topic: "templates", assetMix: "World / streaming", stars: 1294, storage: "4.2 GB", updated: "1d ago" },
  { org: "monolith", repo: "audio-bank", description: "Shared SFX and ambience library mixed for cross-project reuse.", topic: "assets", assetMix: "Audio-heavy", stars: 738, storage: "812 MB", updated: "3d ago" },
  { org: "monolith", repo: "character-models", description: "Rigged hero and NPC meshes with LODs and material variants.", topic: "assets", assetMix: "Model-heavy", stars: 656, storage: "2.1 GB", updated: "5d ago" },
  { org: "pixelworks", repo: "ui-kit", description: "Engine-agnostic UI atlases, fonts, and HUD source files.", topic: "assets", assetMix: "Image-heavy", stars: 311, storage: "240 MB", updated: "1w ago" },
  { org: "studio-collective", repo: "pipeline-templates", description: "Reusable LoreCI pipelines for build, cook, and asset validation.", topic: "teams", assetMix: "Config / CI", stars: 528, storage: "12 MB", updated: "1w ago" },
];

const FILTERS = [
  { id: "all", label: "All" },
  { id: "templates", label: "Templates" },
  { id: "assets", label: "Shared assets" },
  { id: "teams", label: "Team spaces" },
] as const;

export default async function ExplorePage({ searchParams }: ExplorePageProps) {
  const queryParams = await searchParams;
  const query = getSearchParamValue(queryParams.q)?.trim() ?? "";
  const topic = getSearchParamValue(queryParams.topic) ?? "all";

  const repos = REPOS.filter((r) => {
    const matchesTopic = topic === "all" || r.topic === topic;
    const matchesQuery =
      !query ||
      `${r.org}/${r.repo} ${r.description} ${r.assetMix}`.toLowerCase().includes(query.toLowerCase());
    return matchesTopic && matchesQuery;
  });

  return (
    <main className="shell page">
      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Explore</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Discover binary-first repositories, shared asset libraries, and team spaces.</p>
        </div>
      </div>

      <form method="get" className="filter-search">
        <input
          name="q"
          defaultValue={query}
          placeholder="Search repositories, assets, topics…"
          type="search"
          aria-label="Search repositories"
        />
        {topic !== "all" ? <input type="hidden" name="topic" value={topic} /> : null}
        <button className="button" type="submit">Search</button>
      </form>

      <div className="meta-row" style={{ flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const href = f.id === "all"
            ? `/explore${query ? `?q=${encodeURIComponent(query)}` : ""}`
            : `/explore?topic=${f.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`;
          const active = topic === f.id;
          return (
            <Link
              key={f.id}
              href={href}
              className={`pill ${active ? "" : "muted-pill"}`}
              style={active ? { background: "var(--brand-soft)", color: "var(--brand)", borderColor: "var(--brand)" } : {}}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {repos.length ? (
        <section className="grid three">
          {repos.map((r) => (
            <article key={`${r.org}/${r.repo}`} className="panel" style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div className="meta-row" style={{ justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: "1.02rem" }}>
                  <Link href={`/${r.org}/${r.repo}`}>{r.org}/{r.repo}</Link>
                </h2>
                <span className="pill muted-pill">{r.assetMix}</span>
              </div>
              <p className="muted" style={{ margin: 0, fontSize: "0.9rem", flex: 1 }}>{r.description}</p>
              <div className="list-row-meta" style={{ marginTop: 0 }}>
                <span>★ {r.stars.toLocaleString()}</span>
                <span>· {r.storage}</span>
                <span>· updated {r.updated}</span>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="empty-state">
          <h3>No repositories match</h3>
          <p className="muted">Try a different search term or clear the topic filter.</p>
        </div>
      )}
    </main>
  );
}
