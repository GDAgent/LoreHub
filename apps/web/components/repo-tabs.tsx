import Link from "next/link";

type RepoTab =
  | "code"
  | "revisions"
  | "branches"
  | "issues"
  | "cr"
  | "pipelines"
  | "assets"
  | "locks"
  | "analytics"
  | "settings";

type RepoTabsProps = {
  org: string;
  repo: string;
  active: RepoTab;
};

const tabs: { id: RepoTab; label: string; href: (org: string, repo: string) => string }[] = [
  { id: "code", label: "Code", href: (o, r) => `/${o}/${r}` },
  { id: "revisions", label: "Revisions", href: (o, r) => `/${o}/${r}/revisions` },
  { id: "branches", label: "Branches", href: (o, r) => `/${o}/${r}/branches` },
  { id: "issues", label: "Issues", href: (o, r) => `/${o}/${r}/issues` },
  { id: "cr", label: "Change requests", href: (o, r) => `/${o}/${r}/cr` },
  { id: "pipelines", label: "Pipelines", href: (o, r) => `/${o}/${r}/pipelines` },
  { id: "assets", label: "Assets", href: (o, r) => `/${o}/${r}/assets` },
  { id: "locks", label: "Locks", href: (o, r) => `/${o}/${r}/locks` },
  { id: "analytics", label: "Analytics", href: (o, r) => `/${o}/${r}/analytics` },
  { id: "settings", label: "Settings", href: (o, r) => `/${o}/${r}/settings` },
];

export function RepoTabs({ org, repo, active }: RepoTabsProps) {
  return (
    <nav className="route-strip" aria-label="Repository sections">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href(org, repo)}
          className={tab.id === active ? "active" : undefined}
          aria-current={tab.id === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
