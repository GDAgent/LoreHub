import Link from "next/link";

import { demoMembers, getUser } from "@/lib/demo-collaboration";
import { getSearchParamValue } from "@/lib/search-params";

type OrganizationSettingsPageProps = {
  params: Promise<{
    org: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrganizationSettingsPage({ params, searchParams }: OrganizationSettingsPageProps) {
  const { org } = await params;
  const queryParams = await searchParams;
  const highlightedMember = getSearchParamValue(queryParams.member);

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}><strong>{org}</strong></Link>
        </div>
        <nav className="route-strip" aria-label="Organization sections">
          <Link href={`/${org}/settings`} className="active" aria-current="page">Settings</Link>
          <Link href={`/${org}/teams`}>Teams</Link>
          <Link href={`/${org}/notifications`}>Notifications</Link>
          <Link href={`/${org}/demo/settings`}>Repository permissions</Link>
        </nav>
      </section>

      <div className="section-header">
        <div>
          <h1 style={{ margin: 0 }}>Organization settings</h1>
          <p className="muted" style={{ margin: "0.35rem 0 0" }}>Namespaces, members, and global policy. Teams and repo permissions inherit from here.</p>
        </div>
      </div>

      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Profile</h2>
        <div className="grid two">
          <div className="field">
            <label htmlFor="org-name">Display name</label>
            <input id="org-name" name="org-name" defaultValue={org} type="text" />
          </div>
          <div className="field">
            <label htmlFor="org-url">Public URL</label>
            <input id="org-url" name="org-url" defaultValue={`https://lorehub.dev/${org}`} type="text" />
          </div>
        </div>
        <button className="button" type="submit" style={{ marginTop: "1rem" }}>Save changes</button>
      </section>

      <section className="panel">
        <div className="section-header">
          <h2 style={{ margin: 0 }}>Members</h2>
          <span className="muted">{demoMembers.length} members</span>
        </div>
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Title</th><th>Org role</th><th>Repo role</th></tr>
          </thead>
          <tbody>
            {demoMembers.map((member) => {
              const user = getUser(member.username);
              const highlighted = highlightedMember === member.username;
              return (
                <tr key={member.username} style={highlighted ? { background: "var(--brand-soft)" } : undefined}>
                  <td><strong>{user?.name ?? member.username}</strong></td>
                  <td className="muted">{user?.title ?? "Contributor"}</td>
                  <td><span className="pill muted-pill">{member.orgRole}</span></td>
                  <td>{member.repoRole}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="grid two">
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Org policies</h2>
          <ul className="list">
            <li>Owners manage billing, members, and org-wide role policy</li>
            <li>Maintainers manage teams and repository protections</li>
            <li>Reporters participate in issues and CR reviews without push access</li>
          </ul>
        </article>
        <article className="panel">
          <h2 style={{ marginTop: 0 }}>Audit highlights</h2>
          <ul className="list">
            <li>Added Art Reviewers as a default review team for <code>demo</code></li>
            <li>Promoted Rin Tanaka to Maintainer for the demo repository</li>
            <li>Updated branch protections to require 2 approvals on <code>main</code></li>
          </ul>
        </article>
      </section>
    </main>
  );
}
