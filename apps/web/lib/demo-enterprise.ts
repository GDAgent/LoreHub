export type EnterpriseProvider = {
  id: string;
  name: string;
  protocol: "SAML" | "OIDC";
  status: "active" | "staged";
  domain: string;
  details: string[];
};

export type AuditEvent = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  severity: "info" | "warning" | "critical";
  details: string;
};

export type LdapSyncSnapshot = {
  host: string;
  baseDn: string;
  bindUser: string;
  status: "healthy" | "attention";
  syncedUsers: number;
  syncedGroups: number;
  lastRun: string;
  interval: string;
  mappedTeams: Array<{ group: string; team: string }>;
};

export type BillingInvoice = {
  id: string;
  amount: string;
  status: "paid" | "due";
  period: string;
};

export type BillingMetric = {
  label: string;
  value: string;
  note: string;
};

export type Incident = {
  id: string;
  title: string;
  impact: string;
  status: "monitoring" | "resolved" | "investigating";
  startedAt: string;
};

export const enterpriseProviders: EnterpriseProvider[] = [
  {
    id: "oidc-google-workspace",
    name: "Google Workspace",
    protocol: "OIDC",
    status: "active",
    domain: "studio.dev",
    details: [
      "Issuer: https://accounts.google.com",
      "Client scopes: openid email profile groups",
      "Automatic team mapping from hosted domain claims",
    ],
  },
  {
    id: "oidc-okta",
    name: "Okta Production",
    protocol: "OIDC",
    status: "staged",
    domain: "corp.studio.dev",
    details: [
      "Issuer: https://studio.okta.com/oauth2/default",
      "PKCE enabled for browser sign-in",
      "SCIM bridge planned after LDAP cutover",
    ],
  },
  {
    id: "saml-acme",
    name: "Acme SAML",
    protocol: "SAML",
    status: "active",
    domain: "acme.games",
    details: [
      "ACS URL: https://demo.lorehub.app/auth/saml/callback",
      "Signed assertions required",
      "Role mapping from memberOf attributes",
    ],
  },
];

export const ldapSnapshot: LdapSyncSnapshot = {
  host: "ldaps://directory.acme.games:636",
  baseDn: "OU=Studio,DC=acme,DC=games",
  bindUser: "CN=lorehub-sync,OU=Service Accounts,DC=acme,DC=games",
  status: "healthy",
  syncedUsers: 148,
  syncedGroups: 23,
  lastRun: "2026-06-17T19:20:00Z",
  interval: "15 minutes",
  mappedTeams: [
    { group: "CN=Engine,OU=Teams,DC=acme,DC=games", team: "engine" },
    { group: "CN=Art Reviewers,OU=Teams,DC=acme,DC=games", team: "art-reviewers" },
    { group: "CN=Ops,OU=Teams,DC=acme,DC=games", team: "ops" },
  ],
};

export const auditEvents: AuditEvent[] = [
  {
    id: "audit-3011",
    timestamp: "2026-06-17T18:44:00Z",
    actor: "maya",
    action: "policy.update",
    target: "repo/acme/demo",
    severity: "info",
    details: "Raised main branch approval requirement from 1 to 2.",
  },
  {
    id: "audit-3010",
    timestamp: "2026-06-17T18:11:00Z",
    actor: "system:ldap-sync",
    action: "team.membership.sync",
    target: "org/acme/teams/engine",
    severity: "info",
    details: "Imported 3 membership changes from LDAP group mappings.",
  },
  {
    id: "audit-3009",
    timestamp: "2026-06-17T17:35:00Z",
    actor: "omar",
    action: "obliteration.approve",
    target: "repo/acme/demo/obl-103",
    severity: "warning",
    details: "Approved irreversible removal of licensed temp footage from the capture archive.",
  },
  {
    id: "audit-3008",
    timestamp: "2026-06-17T16:50:00Z",
    actor: "maya",
    action: "role.update",
    target: "org/acme/members/rin",
    severity: "critical",
    details: "Promoted Rin Tanaka from Developer to Maintainer on repo acme/demo.",
  },
];

export const billingMetrics: BillingMetric[] = [
  {
    label: "Monthly recurring revenue",
    value: "$4,280",
    note: "Cloud plans plus enterprise seat upgrades billed through Stripe.",
  },
  {
    label: "Billable storage",
    value: "812 GB",
    note: "Deduplicated bytes after Lore shared-store savings.",
  },
  {
    label: "Seat count",
    value: "87 seats",
    note: "Includes 14 enterprise SSO-enabled accounts.",
  },
  {
    label: "Queued invoices",
    value: "2",
    note: "Pending ACH confirmation for annual renewals.",
  },
];

export const billingInvoices: BillingInvoice[] = [
  {
    id: "inv_2026_06_acme",
    amount: "$1,420.00",
    status: "paid",
    period: "Jun 2026",
  },
  {
    id: "inv_2026_06_nova",
    amount: "$860.00",
    status: "due",
    period: "Jun 2026",
  },
  {
    id: "inv_2026_05_arcadia",
    amount: "$1,125.00",
    status: "paid",
    period: "May 2026",
  },
];

export const incidents: Incident[] = [
  {
    id: "inc-204",
    title: "Elevated login latency in EU region",
    impact: "OIDC callbacks briefly exceeded the 400ms target in Frankfurt.",
    status: "resolved",
    startedAt: "2026-06-17T11:12:00Z",
  },
  {
    id: "inc-203",
    title: "Artifact upload backlog on ce-runner-01",
    impact: "Two review builds were delayed while the worker queue drained.",
    status: "monitoring",
    startedAt: "2026-06-16T20:08:00Z",
  },
];

export const slaOverview = {
  uptime: "99.96%",
  apiLatencyP95: "182ms",
  mttr: "14m",
  errorBudget: "83% remaining",
};

export function filterAuditEvents(query?: string, severity?: string) {
  return auditEvents.filter((event) => {
    if (severity && severity !== "all" && event.severity !== severity) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = `${event.actor} ${event.action} ${event.target} ${event.details}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });
}

export function getEnterpriseProvider(providerId?: string) {
  return enterpriseProviders.find((provider) => provider.id === providerId) ?? enterpriseProviders[0];
}
