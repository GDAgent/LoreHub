import { buildCreatedTeam, demoTeams, getUser } from "@/lib/demo-collaboration";
import { getSearchParamValue } from "@/lib/search-params";

type TeamsPageProps = {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TeamsPage({ params, searchParams }: TeamsPageProps) {
  const { org } = await params;
  const queryParams = await searchParams;
  const teamName = getSearchParamValue(queryParams.teamName);
  const teamDescription = getSearchParamValue(queryParams.teamDescription);
  const teamMembers = getSearchParamValue(queryParams.teamMembers);
  const createdTeam = teamName?.trim() ? buildCreatedTeam({ name: teamName, description: teamDescription, members: teamMembers }) : null;
  const visibleTeams = createdTeam ? [createdTeam, ...demoTeams] : demoTeams;

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="repo-path">{org}</div>
          <h1>Teams</h1>
          <p className="muted">Teams group members for review routing, permissions, and ownership boundaries.</p>
          <div className="revision-list top-gap">
            {visibleTeams.map((team) => (
              <article key={team.slug} className="revision-card">
                <div className="meta-row">
                  <span className="pill">{team.name}</span>
                  <span className="pill muted-pill">{team.slug}</span>
                </div>
                <p className="muted">{team.description}</p>
                <div className="meta-row muted">
                  <span>Members: {team.members.map((member) => getUser(member)?.name ?? member).join(", ")}</span>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel form-card">
          <h2>Create team</h2>
          <form className="form-grid" method="get">
            <div className="field">
              <label htmlFor="teamName">Team name</label>
              <input id="teamName" name="teamName" placeholder="Narrative Reviewers" type="text" />
            </div>
            <div className="field">
              <label htmlFor="teamDescription">Description</label>
              <textarea id="teamDescription" name="teamDescription" placeholder="Owns story beats, cutscene timing, and dialogue review." rows={4} />
            </div>
            <div className="field">
              <label htmlFor="teamMembers">Members</label>
              <input id="teamMembers" name="teamMembers" placeholder="@maya, @omar" type="text" />
            </div>
            <button className="button" type="submit">
              Create team
            </button>
          </form>
          {createdTeam ? <p className="success-text">Created team {createdTeam.name}.</p> : null}
        </article>
      </section>
    </main>
  );
}
