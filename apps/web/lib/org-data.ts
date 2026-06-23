/**
 * Organization data access — live API only.
 */

import {
  apiGet,
  type ApiOrgDetail,
  type ApiOrgMember,
  type ApiTeam,
} from "@/lib/api";

export type OrgDetail = {
  name: string;
  displayName: string;
  plan: string;
  memberCount: number;
};

export type OrgMember = {
  username: string;
  displayName: string;
  title: string | null;
  avatarInitials: string | null;
  role: string;
};

export type Team = {
  slug: string;
  name: string;
  description: string | null;
  members: string[];
};

export async function getOrg(org: string): Promise<OrgDetail | null> {
  const live = await apiGet<ApiOrgDetail>(`/api/v1/orgs/${encodeURIComponent(org)}`);
  if (!live) {
    return null;
  }
  return {
    name: live.name,
    displayName: live.display_name,
    plan: live.plan,
    memberCount: live.member_count,
  };
}

export async function getOrgMembers(org: string): Promise<OrgMember[]> {
  const live = await apiGet<ApiOrgMember[]>(`/api/v1/orgs/${encodeURIComponent(org)}/members`);
  if (!live) {
    return [];
  }
  return live.map((member) => ({
    username: member.username,
    displayName: member.display_name,
    title: member.title,
    avatarInitials: member.avatar_initials,
    role: member.role,
  }));
}

export async function getTeams(org: string): Promise<Team[]> {
  const live = await apiGet<ApiTeam[]>(`/api/v1/orgs/${encodeURIComponent(org)}/teams`);
  if (!live) {
    return [];
  }
  return live.map((team) => ({
    slug: team.slug,
    name: team.name,
    description: team.description,
    members: team.members,
  }));
}
