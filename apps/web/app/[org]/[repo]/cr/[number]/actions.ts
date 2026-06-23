"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiPost } from "@/lib/api";

function crPath(org: string, repo: string, number: number) {
  return `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}/change-requests/${number}`;
}

function back(org: string, repo: string, number: number, error?: string) {
  revalidatePath(`/${org}/${repo}/cr/${number}`);
  redirect(`/${org}/${repo}/cr/${number}${error ? `?error=${encodeURIComponent(error)}` : ""}`);
}

export async function approveChangeRequestAction(org: string, repo: string, number: number) {
  const result = await apiPost(`${crPath(org, repo, number)}/reviews`, {
    state: "approved",
    body: "Approved.",
  });
  back(org, repo, number, result.ok ? undefined : result.error);
}

export async function commentChangeRequestAction(
  org: string,
  repo: string,
  number: number,
  formData: FormData,
) {
  const body = String(formData.get("commentBody") ?? "").trim();
  if (!body) {
    back(org, repo, number);
  }
  const result = await apiPost(`${crPath(org, repo, number)}/comments`, { body });
  back(org, repo, number, result.ok ? undefined : result.error);
}

export async function inlineCommentChangeRequestAction(
  org: string,
  repo: string,
  number: number,
  formData: FormData,
) {
  const body = String(formData.get("inlineComment") ?? "").trim();
  const filePath = String(formData.get("inlinePath") ?? "").trim();
  const line = Number(formData.get("inlineLine") ?? "");
  if (!body || !filePath) {
    back(org, repo, number);
  }
  const result = await apiPost(`${crPath(org, repo, number)}/comments`, {
    body,
    file_path: filePath,
    line: Number.isFinite(line) ? line : null,
  });
  back(org, repo, number, result.ok ? undefined : result.error);
}

export async function mergeChangeRequestAction(org: string, repo: string, number: number) {
  const result = await apiPost(`${crPath(org, repo, number)}/merge`, {});
  back(org, repo, number, result.ok ? undefined : result.error);
}
