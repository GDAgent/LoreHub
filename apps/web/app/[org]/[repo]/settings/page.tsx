import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
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
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="settings" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Repository settings</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Access, branch protection, and role capabilities for this repository.</p>
        </div>
      </div>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>General</h2>
          <form className="form-grid">
            <div className="field">
              <label htmlFor="repo-name">Repository name</label>
              <input id="repo-name" name="repo-name" defaultValue={repo} type="text" />
            </div>
            <div className="field">
              <label htmlFor="repo-desc">Description</label>
              <textarea id="repo-desc" name="repo-desc" rows={3} defaultValue="Reference arena vertical slice for the LoreHub demo." />
            </div>
            <div className="field">
              <label htmlFor="repo-visibility">Visibility</label>
              <select id="repo-visibility" name="repo-visibility" defaultValue="private">
                <option value="private">Private</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
              </select>
            </div>
            <button className="button" type="submit">Save changes</button>
          </form>
        </article>

        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Branch protection</h2>
          <ul className="list">
            <li><code>main</code> requires 2 approvals before merge</li>
            <li>At least one reviewer from <strong>Art Reviewers</strong> for asset-heavy changes</li>
            <li>Only Owners and Maintainers can merge approved change requests</li>
            <li>Pipeline must pass before the merge box unlocks</li>
          </ul>
          <h2>Default reviewers</h2>
          <div className="metadata-list">
            {demoTeams.map((team) => (
              <div key={team.slug} className="metadata-row">
                <span className="muted">{team.name}</span>
                <strong>{team.defaultReviewersFor.join(", ") || "—"}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Access assignments</h2>
        <table className="table">
          <thead>
            <tr><th>Member</th><th>Org role</th><th>Repo role</th><th>Teams</th></tr>
          </thead>
          <tbody>
            {demoMembers.map((member) => (
              <tr key={member.username}>
                <td><strong>{getUser(member.username)?.name ?? member.username}</strong></td>
                <td>{member.orgRole}</td>
                <td><span className="pill muted-pill">{member.repoRole}</span></td>
                <td>{member.teams.join(", ") || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Role capabilities</h2>
        <table className="table">
          <thead>
            <tr><th>Capability</th><th>Owner</th><th>Maintainer</th><th>Developer</th><th>Reporter</th><th>Guest</th></tr>
          </thead>
          <tbody>
            {permissionMatrix.map((row) => (
              <tr key={row.capability}>
                <td><strong>{row.capability}</strong></td>
                {(["Owner", "Maintainer", "Developer", "Reporter", "Guest"] as const).map((role) => (
                  <td key={role} style={{ color: row[role] ? "var(--success)" : "var(--faint)" }}>{row[role] ? "✓" : "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="panel danger-zone">
        <h2 style={{ marginTop: 0, color: "var(--danger)" }}>Danger zone</h2>
        <div className="danger-row">
          <div>
            <strong>Archive repository</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>Make read-only. History and assets are preserved.</p>
          </div>
          <button className="button-danger" type="button">Archive</button>
        </div>
        <div className="danger-row">
          <div>
            <strong>Transfer ownership</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>Move this repository to another organization.</p>
          </div>
          <button className="button-danger" type="button">Transfer</button>
        </div>
        <div className="danger-row">
          <div>
            <strong>Delete repository</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>Permanently remove this repository and all of its content.</p>
          </div>
          <button className="button-danger" type="button">Delete</button>
        </div>
      </section>
    </main>
  );
}
