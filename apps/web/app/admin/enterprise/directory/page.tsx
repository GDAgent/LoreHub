import { ldapSnapshot } from "@/lib/demo-enterprise";

export default function DirectoryPage() {
  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="repo-path">admin / enterprise</div>
          <h1>LDAP sync</h1>
          <p className="muted">
            Directory sync keeps enterprise org membership and team mappings in step with existing identity infrastructure.
          </p>
          <ul className="list top-gap-sm">
            <li>Host: {ldapSnapshot.host}</li>
            <li>Base DN: {ldapSnapshot.baseDn}</li>
            <li>Bind user: {ldapSnapshot.bindUser}</li>
            <li>Last run: {ldapSnapshot.lastRun.replace("T", " ").replace("Z", " UTC")}</li>
            <li>Sync interval: {ldapSnapshot.interval}</li>
          </ul>
        </article>

        <article className="panel">
          <h2>Sync health</h2>
          <div className="grid two top-gap-sm">
            <div className="stat">
              <strong>{ldapSnapshot.syncedUsers}</strong>
              <span className="muted">Users synced</span>
            </div>
            <div className="stat">
              <strong>{ldapSnapshot.syncedGroups}</strong>
              <span className="muted">Groups synced</span>
            </div>
          </div>
          <div className="meta-row top-gap-sm">
            <span className={`pill ${ldapSnapshot.status === "healthy" ? "success-pill" : "warn-pill"}`}>{ldapSnapshot.status}</span>
          </div>
        </article>
      </section>

      <section className="panel top-gap">
        <h2>Group mappings</h2>
        <div className="table-grid member-table top-gap-sm">
          <div className="table-header">Directory group</div>
          <div className="table-header">LoreHub team</div>
          <div className="table-header">Status</div>
          <div className="table-header">Scope</div>
          {ldapSnapshot.mappedTeams.map((mapping) => (
            <>
              <div key={`${mapping.group}-group`} className="table-cell strong-cell">{mapping.group}</div>
              <div key={`${mapping.group}-team`} className="table-cell">{mapping.team}</div>
              <div key={`${mapping.group}-status`} className="table-cell">active</div>
              <div key={`${mapping.group}-scope`} className="table-cell">org + repo roles</div>
            </>
          ))}
        </div>
      </section>
    </main>
  );
}
