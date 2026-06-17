import { Fragment } from "react";

import { demoMembers, demoTeams, getUser, permissionMatrix } from "@/lib/demo-collaboration";

type RepositorySettingsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function RepositorySettingsPage({ params }: RepositorySettingsPageProps) {
  const { org, repo } = await params;

  return (
    <main className="shell page">
      <section className="panel">
        <div className="repo-path">{org} / {repo}</div>
        <h1>Repository settings</h1>
        <p className="muted">
          Phase 2 makes permissions explicit: who can triage, review, push, and merge, and which teams are default reviewers for protected work.
        </p>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2>Access assignments</h2>
          <div className="table-grid member-table top-gap-sm">
            <div className="table-header">Member</div>
          <div className="table-header">Org role</div>
          <div className="table-header">Repo role</div>
          <div className="table-header">Teams</div>
          {demoMembers.map((member) => (
            <Fragment key={member.username}>
              <div className="table-cell strong-cell">{getUser(member.username)?.name ?? member.username}</div>
              <div className="table-cell">{member.orgRole}</div>
              <div className="table-cell">{member.repoRole}</div>
              <div className="table-cell">{member.teams.join(", ")}</div>
            </Fragment>
          ))}
          </div>
        </article>

        <article className="panel">
          <h2>Branch protection</h2>
          <ul className="list">
            <li>`main` requires 2 approvals</li>
            <li>At least one reviewer must come from the `Art Reviewers` team for asset-heavy changes</li>
            <li>Only Owners and Maintainers can merge approved change requests</li>
          </ul>
          <div className="top-gap section-divider" />
          <h2>Default reviewers</h2>
          <ul className="list">
            {demoTeams.map((team) => (
              <li key={team.slug}>{team.name} for repos: {team.defaultReviewersFor.join(", ")}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="panel top-gap">
        <h2>Role capabilities</h2>
        <div className="permission-table top-gap-sm">
          <div className="table-header">Capability</div>
          <div className="table-header">Owner</div>
          <div className="table-header">Maintainer</div>
          <div className="table-header">Developer</div>
          <div className="table-header">Reporter</div>
          <div className="table-header">Guest</div>
          {permissionMatrix.map((row) => (
            <Fragment key={row.capability}>
              <div className="table-cell strong-cell">{row.capability}</div>
              <div className="table-cell">{row.Owner ? "Yes" : "No"}</div>
              <div className="table-cell">{row.Maintainer ? "Yes" : "No"}</div>
              <div className="table-cell">{row.Developer ? "Yes" : "No"}</div>
              <div className="table-cell">{row.Reporter ? "Yes" : "No"}</div>
              <div className="table-cell">{row.Guest ? "Yes" : "No"}</div>
            </Fragment>
          ))}
        </div>
      </section>
    </main>
  );
}
