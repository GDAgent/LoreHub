"use server";

import { redirect } from "next/navigation";

import { apiPost } from "@/lib/api";

export async function createIssueAction(org: string, repo: string, formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title) {
    redirect(`/${org}/${repo}/issues?error=title-required`);
  }

  const result = await apiPost<{ number: number }>(
    `/api/v1/orgs/${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}/issues`,
    { title, body },
  );

  if (!result.ok) {
    redirect(`/${org}/${repo}/issues?error=${encodeURIComponent(result.error)}`);
  }

  redirect(`/${org}/${repo}/issues/${result.data.number}`);
}
