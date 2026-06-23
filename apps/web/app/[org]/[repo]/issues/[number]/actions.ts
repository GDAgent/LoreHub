"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiSend } from "@/lib/api";

function repoPath(org: string, repo: string) {
  return `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`;
}

export async function addIssueCommentAction(
  org: string,
  repo: string,
  number: number,
  formData: FormData,
) {
  const body = String(formData.get("commentBody") ?? "").trim();
  if (!body) {
    redirect(`/${org}/${repo}/issues/${number}`);
  }
  await apiSend("POST", `${repoPath(org, repo)}/issues/${number}/comments`, { body });
  revalidatePath(`/${org}/${repo}/issues/${number}`);
  redirect(`/${org}/${repo}/issues/${number}`);
}

export async function setIssueStateAction(
  org: string,
  repo: string,
  number: number,
  state: "open" | "closed",
) {
  await apiSend("PATCH", `${repoPath(org, repo)}/issues/${number}`, { state });
  revalidatePath(`/${org}/${repo}/issues/${number}`);
  redirect(`/${org}/${repo}/issues/${number}`);
}
