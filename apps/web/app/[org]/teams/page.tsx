import Link from "next/link";

import { getTeams } from "@/lib/org-data";
import { getSearchParamValue } from "@/lib/search-params";

import { createTeamAction } from "./actions";

type TeamsPageProps = {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamsPage({ params, searchParams }: TeamsPageProps) {
  const { org } = await params;
  const queryParams = await searchParams;
  const error = getSearchParamValue(queryParams.error);
  const visibleTeams = await getTeams(org);
  const createTeam = createTeamAction.bind(null, org);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}><strong>{org}</strong></Link>
        </div>
        <nav className="route-strip" aria-label="Organization sections">
          <Link href={`/${org}/settings`}>Settings</Link>
          <Link href={`/${org}/teams`} className="active" aria-current="page">Teams</Link>
          <Link href={`/${org}/notifications`}>Notifications</Link>
        </nav>
      </section>

      {error ? <p className="error-text">Could not create team: {error}</p> : null}

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Teams</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Group members for review routing, permissions, and ownership boundaries.</p>
        </div>
        <details>
          <summary className="button" style={{ listStyle: "none" }}>New team</summary>
          <div className="panel" style={{ position: "absolute", right: "1.5rem", zIndex: 20, width: "min(460px, 90vw)", marginTop: "0.5rem", boxShadow: "var(--shadow-md)" }}>
            <h3 style={{ marginTop: 0 }}>Create team</h3>
            <form className="form-grid" action={createTeam}>
              <div className="field">
                <label htmlFor="teamName">Team name</label>
                <input id="teamName" name="teamName" placeholder="Narrative Reviewers" type="text" required />
              </div>
              <div className="field">
                <label htmlFor="teamDescription">Description</label>
                <textarea id="teamDescription" name="teamDescription" placeholder="Owns story beats, cutscene timing, and dialogue review." rows={3} />
              </div>
              <button className="button" type="submit">Create team</button>
            </form>
          </div>
        </details>
      </div>

      {visibleTeams.length === 0 ? (
        <div className="list-rows"><div className="empty-state" style={{ border: "none" }}>No teams yet.</div></div>
      ) : (
        <div className="list-rows">
          {visibleTeams.map((team) => (
            <div key={team.slug} className="list-row">
              <span className="list-row-icon state-open"><TeamIcon /></span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/teams`}>{team.name}</Link>
                  <span className="pill muted-pill" style={{ marginLeft: "0.5rem" }}>{team.slug}</span>
                </div>
                {team.description ? <p className="muted" style={{ margin: "0.25rem 0", fontSize: "0.88rem" }}>{team.description}</p> : null}
                <div className="list-row-meta">
                  <span>{team.members.length} members</span>
                  {team.members.length > 0 ? <span>· {team.members.join(", ")}</span> : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function TeamIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M16 11a3 3 0 1 0-1-5.83M21 20a6 6 0 0 0-5-5.91" />
    </svg>
  );
}
