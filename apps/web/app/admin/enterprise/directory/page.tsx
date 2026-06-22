import { AdminTabs } from "@/components/admin-tabs";
import { ldapSnapshot } from "@/lib/demo-enterprise";
import { formatDateTime } from "@/lib/format";

export default function DirectoryPage() {
  return (
    <main className="shell page">
      <section>
        <div className="eyebrow">Administration</div>
        <AdminTabs active="directory" />
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>LDAP / directory sync</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Keep enterprise org membership and team mappings in step with your identity infrastructure.</p>
        </div>
        <span className={`pill ${ldapSnapshot.status === "healthy" ? "success-pill" : "warn-pill"}`}>{ldapSnapshot.status}</span>
      </div>

      <section className="grid four">
        <article className="panel stat-panel"><span className="muted">Users synced</span><strong>{ldapSnapshot.syncedUsers}</strong></article>
        <article className="panel stat-panel"><span className="muted">Groups synced</span><strong>{ldapSnapshot.syncedGroups}</strong></article>
        <article className="panel stat-panel"><span className="muted">Interval</span><strong>{ldapSnapshot.interval}</strong></article>
        <article className="panel stat-panel"><span className="muted">Last run</span><strong style={{ fontSize: "1rem" }}>{formatDateTime(ldapSnapshot.lastRun)}</strong></article>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Connection</h2>
          <div className="metadata-list">
            <div className="metadata-row"><span className="muted">Host</span><code style={{ fontSize: "0.8rem" }}>{ldapSnapshot.host}</code></div>
            <div className="metadata-row"><span className="muted">Base DN</span><code style={{ fontSize: "0.8rem" }}>{ldapSnapshot.baseDn}</code></div>
            <div className="metadata-row"><span className="muted">Bind user</span><code style={{ fontSize: "0.8rem" }}>{ldapSnapshot.bindUser}</code></div>
          </div>
        </article>
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <button className="button" type="button">Run sync now</button>
            <button className="button-secondary" type="button">Edit connection</button>
            <button className="button-secondary" type="button">Test bind</button>
          </div>
        </article>
      </section>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Group mappings</h2>
        <table className="table">
          <thead>
            <tr><th>Directory group</th><th>LoreHub team</th><th>Status</th><th>Scope</th></tr>
          </thead>
          <tbody>
            {ldapSnapshot.mappedTeams.map((mapping) => (
              <tr key={mapping.group}>
                <td><code style={{ fontSize: "0.82rem" }}>{mapping.group}</code></td>
                <td><strong>{mapping.team}</strong></td>
                <td><span className="pill success-pill">active</span></td>
                <td className="muted">org + repo roles</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
