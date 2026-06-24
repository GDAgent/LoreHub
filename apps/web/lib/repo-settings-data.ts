/**
 * Repository settings data access — live API only.
 */

import {
  apiGet,
  type ApiRepoCollaborator,
  type ApiRepoSettings,
} from "@/lib/api";

export type RepoSettings = {
  name: string;
  displayName: string;
  description: string | null;
  visibility: string;
  defaultBranch: string;
  requiredApprovals: number;
  archived: boolean;
};

export type RepoCollaborator = {
  username: string;
  displayName: string;
  orgRole: string;
  repoRole: string;
  teams: string[];
};

export async function getRepoSettings(org: string, repo: string): Promise<RepoSettings | null> {
  const live = await apiGet<ApiRepoSettings>(
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`,
  );
  if (!live) {
    return null;
  }
  return {
    name: live.name,
    displayName: live.display_name,
    description: live.description,
    visibility: live.visibility,
    defaultBranch: live.default_branch,
    requiredApprovals: live.required_approvals,
    archived: live.archived,
  };
}

export async function getRepoCollaborators(org: string, repo: string): Promise<RepoCollaborator[]> {
  const live = await apiGet<ApiRepoCollaborator[]>(
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}/collaborators`,
  );
  if (!live) {
    return [];
  }
  return live.map((c) => ({
    username: c.username,
    displayName: c.display_name,
    orgRole: c.org_role,
    repoRole: c.repo_role,
    teams: c.teams,
  }));
}
