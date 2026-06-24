"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiSend, type ApiRepoSettings } from "@/lib/api";

export async function updateRepoSettingsAction(org: string, repo: string, formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "").trim();
  const requiredApprovalsRaw = String(formData.get("requiredApprovals") ?? "").trim();
  const defaultBranch = String(formData.get("defaultBranch") ?? "").trim();

  const body: Record<string, unknown> = {
    display_name: displayName || null,
    description,
    visibility: visibility || null,
    default_branch: defaultBranch || null,
  };
  if (requiredApprovalsRaw) {
    const parsed = Number.parseInt(requiredApprovalsRaw, 10);
    if (Number.isFinite(parsed)) {
      body.required_approvals = parsed;
    }
  }

  const result = await apiSend<ApiRepoSettings>(
    "PATCH",
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`,
    body,
  );
  if (!result.ok) {
    redirect(`/${org}/${repo}/settings?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/${org}/${repo}/settings`);
  redirect(`/${org}/${repo}/settings?saved=1`);
}

export async function setRepoArchivedAction(
  org: string,
  repo: string,
  archived: boolean,
  _formData: FormData,
) {
  const result = await apiSend<ApiRepoSettings>(
    "PATCH",
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`,
    { archived },
  );
  if (!result.ok) {
    redirect(`/${org}/${repo}/settings?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/${org}/${repo}/settings`);
  redirect(`/${org}/${repo}/settings?saved=1`);
}
