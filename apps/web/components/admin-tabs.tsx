import Link from "next/link";

type AdminTab = "overview" | "auth" | "directory" | "audit" | "sla" | "billing";

const tabs: { id: AdminTab; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/admin" },
  { id: "auth", label: "SSO", href: "/admin/enterprise/auth" },
  { id: "directory", label: "Directory", href: "/admin/enterprise/directory" },
  { id: "audit", label: "Audit log", href: "/admin/enterprise/audit" },
  { id: "sla", label: "SLA", href: "/admin/enterprise/sla" },
  { id: "billing", label: "Billing", href: "/admin/cloud/billing" },
];

export function AdminTabs({ active }: { active: AdminTab }) {
  return (
    <nav className="route-strip" aria-label="Admin sections">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={tab.id === active ? "active" : undefined}
          aria-current={tab.id === active ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
