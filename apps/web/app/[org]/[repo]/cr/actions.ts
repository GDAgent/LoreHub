"use server";

import { redirect } from "next/navigation";

import { apiPost } from "@/lib/api";

export async function createChangeRequestAction(org: string, repo: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const sourceBranch = String(formData.get("sourceBranch") ?? "").trim();
  const targetBranch = String(formData.get("targetBranch") ?? "").trim() || "main";
  if (!title || !sourceBranch) {
    redirect(`/${org}/${repo}/cr?error=title-and-source-required`);
  }

  const result = await apiPost<{ number: number }>(
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}/change-requests`,
    { title, body, source_branch: sourceBranch, target_branch: targetBranch },
  );

  if (!result.ok) {
    redirect(`/${org}/${repo}/cr?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/${org}/${repo}/cr/${result.data.number}`);
}
