"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { apiPost } from "@/lib/api";

export async function createTeamAction(org: string, formData: FormData) {
  const name = String(formData.get("teamName") ?? "").trim();
  const description = String(formData.get("teamDescription") ?? "").trim();
  if (!name) {
    redirect(`/${org}/teams?error=name-required`);
  }
  const result = await apiPost<{ slug: string }>(
    `/api/v1/orgs/${encodeURIComponent(org)}/teams`,
    { name, description: description || null },
  );
  if (!result.ok) {
    redirect(`/${org}/teams?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath(`/${org}/teams`);
  redirect(`/${org}/teams`);
}
