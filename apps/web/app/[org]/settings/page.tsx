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
      <section className="panel">
        <div className="repo-path">{org}</div>
        <h1>Organization settings</h1>
        <p className="muted">
          Organizations own namespaces, members, and global policy. Teams and repo permissions inherit from here.
        </p>
        <div className="stack-links top-gap-sm inline-stack">
          <Link href={`/${org}/teams`}>Teams</Link>
          <Link href={`/${org}/notifications`}>Notifications</Link>
          <Link href={`/${org}/demo/settings`}>Repository permissions</Link>
        </div>
      </section>

      <section className="panel top-gap">
        <h2>Members</h2>
        <div className="table-grid member-table top-gap-sm">
          <div className="table-header">Name</div>
          <div className="table-header">Title</div>
          <div className="table-header">Org role</div>
          <div className="table-header">Repo role</div>
          {demoMembers.map((member) => {
            const user = getUser(member.username);
            const isHighlighted = highlightedMember === member.username;

            return (
              <>
                <div key={`${member.username}-name`} className={`table-cell strong-cell ${isHighlighted ? "highlight-cell" : ""}`}>
                  {user?.name ?? member.username}
                </div>
                <div key={`${member.username}-title`} className="table-cell">{user?.title ?? "Contributor"}</div>
                <div key={`${member.username}-org`} className="table-cell">{member.orgRole}</div>
                <div key={`${member.username}-repo`} className="table-cell">{member.repoRole}</div>
              </>
            );
          })}
        </div>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Org policies</h2>
          <ul className="list">
            <li>Owners can manage billing, members, and org-wide role policy</li>
            <li>Maintainers can manage teams and repository protections</li>
            <li>Reporters can participate in issues and CR reviews without push access</li>
          </ul>
        </article>
        <article className="panel">
          <h2>Audit highlights</h2>
          <ul className="list">
            <li>Added Art Reviewers as a default review team for `demo`</li>
            <li>Promoted Rin Tanaka to Maintainer for the demo repository</li>
            <li>Updated branch protections to require 2 approvals on `main`</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
