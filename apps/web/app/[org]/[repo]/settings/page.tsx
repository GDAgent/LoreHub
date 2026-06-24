import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { getTeams } from "@/lib/org-data";
import { getRepoCollaborators, getRepoSettings } from "@/lib/repo-settings-data";
import { getSearchParamValue } from "@/lib/search-params";

import { setRepoArchivedAction, updateRepoSettingsAction } from "./actions";

type RepositorySettingsPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const ROLES = ["Owner", "Maintainer", "Developer", "Reporter", "Guest"] as const;

// Product RBAC reference — the capability model repo roles map to.
const ROLE_CAPABILITIES: Array<{ capability: string } & Record<(typeof ROLES)[number], boolean>> = [
  { capability: "Manage members and teams", Owner: true, Maintainer: false, Developer: false, Reporter: false, Guest: false },
  { capability: "Create and triage issues", Owner: true, Maintainer: true, Developer: true, Reporter: true, Guest: false },
  { capability: "Comment and review change requests", Owner: true, Maintainer: true, Developer: true, Reporter: true, Guest: false },
  { capability: "Push protected branches", Owner: true, Maintainer: true, Developer: false, Reporter: false, Guest: false },
  { capability: "Merge approved change requests", Owner: true, Maintainer: true, Developer: false, Reporter: false, Guest: false },
];

export default async function RepositorySettingsPage({ params, searchParams }: RepositorySettingsPageProps) {
  const { org, repo } = await params;
  const query = await searchParams;
  const error = getSearchParamValue(query.error);
  const saved = getSearchParamValue(query.saved);

  const [settings, collaborators, teams] = await Promise.all([
    getRepoSettings(org, repo),
    getRepoCollaborators(org, repo),
    getTeams(org),
  ]);

  if (!settings) {
    return (
      <main className="shell page">
        <section>
          <div className="repo-path">
            <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
          </div>
          <RepoTabs org={org} repo={repo} active="settings" />
        </section>
        <div className="empty-state">Repository not found.</div>
      </main>
    );
  }

  const saveSettings = updateRepoSettingsAction.bind(null, org, repo);
  const toggleArchive = setRepoArchivedAction.bind(null, org, repo, !settings.archived);

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

      {error ? <p className="error-text">Could not save: {error}</p> : null}
      {saved ? <p className="success-text">Settings saved.</p> : null}

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>General</h2>
          <form className="form-grid" action={saveSettings}>
            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input id="displayName" name="displayName" defaultValue={settings.displayName} type="text" />
            </div>
            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={3} defaultValue={settings.description ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="visibility">Visibility</label>
              <select id="visibility" name="visibility" defaultValue={settings.visibility}>
                <option value="private">Private</option>
                <option value="internal">Internal</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="defaultBranch">Default branch</label>
                <input id="defaultBranch" name="defaultBranch" defaultValue={settings.defaultBranch} type="text" />
              </div>
              <div className="field">
                <label htmlFor="requiredApprovals">Required approvals</label>
                <input id="requiredApprovals" name="requiredApprovals" defaultValue={settings.requiredApprovals} type="number" min={0} />
              </div>
            </div>
            <button className="button" type="submit">Save changes</button>
          </form>
        </article>

        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Branch protection</h2>
          <ul className="list">
            <li><code>{settings.defaultBranch}</code> requires {settings.requiredApprovals} {settings.requiredApprovals === 1 ? "approval" : "approvals"} before merge</li>
            <li>Only Owners and Maintainers can merge approved change requests</li>
          </ul>
          <h2>Review teams</h2>
          {teams.length === 0 ? (
            <p className="muted">No teams configured for this organization.</p>
          ) : (
            <div className="metadata-list">
              {teams.map((team) => (
                <div key={team.slug} className="metadata-row">
                  <span className="muted">{team.name}</span>
                  <strong>{team.members.join(", ") || "—"}</strong>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Access assignments</h2>
        {collaborators.length === 0 ? (
          <p className="muted">No collaborators yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Member</th><th>Org role</th><th>Repo role</th><th>Teams</th></tr>
            </thead>
            <tbody>
              {collaborators.map((member) => (
                <tr key={member.username}>
                  <td><strong>{member.displayName}</strong> <span className="muted">@{member.username}</span></td>
                  <td>{member.orgRole}</td>
                  <td><span className="pill muted-pill">{member.repoRole}</span></td>
                  <td>{member.teams.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Role capabilities</h2>
        <table className="table">
          <thead>
            <tr><th>Capability</th>{ROLES.map((role) => <th key={role}>{role}</th>)}</tr>
          </thead>
          <tbody>
            {ROLE_CAPABILITIES.map((row) => (
              <tr key={row.capability}>
                <td><strong>{row.capability}</strong></td>
                {ROLES.map((role) => (
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
            <strong>{settings.archived ? "Unarchive repository" : "Archive repository"}</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>
              {settings.archived ? "This repository is read-only. Restore write access." : "Make read-only. History and assets are preserved."}
            </p>
          </div>
          <form action={toggleArchive}>
            <button className="button-danger" type="submit">{settings.archived ? "Unarchive" : "Archive"}</button>
          </form>
        </div>
        <div className="danger-row">
          <div>
            <strong>Obliterate content</strong>
            <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.88rem" }}>Permanently purge specific assets or revisions from history.</p>
          </div>
          <Link className="button-danger" href={`/${org}/${repo}/obliterate`}>Obliterate…</Link>
        </div>
      </section>
    </main>
  );
}
