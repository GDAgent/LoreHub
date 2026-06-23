/**
 * Typed API client for the LoreHub backend.
 *
 * Server Components call these helpers. Every call is resilient: if the API is
 * unreachable or returns a non-2xx status, the helper returns `null` so the
 * caller can fall back to demo data. This keeps the static build and the
 * demo-only mode working while real backend wiring lands page by page.
 */

const API_BASE =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8080";

type ApiGetOptions = {
  /** Forwarded cookies for authenticated requests (Server Component → API). */
  cookie?: string;
};

export async function apiGet<T>(path: string, options: ApiGetOptions = {}): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      headers: options.cookie ? { cookie: options.cookie } : undefined,
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    // API down / network error → caller falls back to demo data.
    return null;
  }
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function apiPost<T>(
  path: string,
  body: unknown,
  options: ApiGetOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(options.cookie ? { cookie: options.cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, error: text || `request failed (${response.status})` };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: "API unreachable" };
  }
}

export async function apiSend<T>(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body: unknown,
  options: ApiGetOptions = {},
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        ...(options.cookie ? { cookie: options.cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      return { ok: false, error: text || `request failed (${response.status})` };
    }
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: "API unreachable" };
  }
}

export function apiBaseUrl(): string {
  return API_BASE;
}

// --- Response shapes (mirror apps/api/src/routes/collaboration.rs) ----------

export type ApiIssueListItem = {
  number: number;
  title: string;
  state: string;
  author_username: string | null;
  labels: string[];
  assignees: string[];
  created_at: string;
};

export type ApiIssueComment = {
  author_username: string | null;
  body: string;
  created_at: string;
};

export type ApiIssueDetail = ApiIssueListItem & {
  body: string;
  comments: ApiIssueComment[];
};

export type ApiChangeRequestListItem = {
  number: number;
  title: string;
  state: string;
  author_username: string | null;
  source_branch: string;
  target_branch: string;
  labels: string[];
  approvals: number;
  created_at: string;
};

export type ApiCrReview = {
  reviewer_username: string | null;
  state: string;
  body: string;
  created_at: string;
};

export type ApiCrComment = {
  author_username: string | null;
  body: string;
  created_at: string;
};

export type ApiCrInlineThread = {
  file_path: string;
  line: number;
  resolved: boolean;
  comments: ApiCrComment[];
};

export type ApiChangeRequestDetail = {
  number: number;
  title: string;
  state: string;
  body: string;
  author_username: string | null;
  source_branch: string;
  target_branch: string;
  base_revision: string | null;
  head_revision: string | null;
  merge_revision: string | null;
  created_at: string;
  merged_at: string | null;
  labels: string[];
  reviewers: string[];
  linked_issues: number[];
  reviews: ApiCrReview[];
  comments: ApiCrComment[];
  inline_threads: ApiCrInlineThread[];
  approvals: number;
  required_approvals: number;
};

export type ApiOrgDetail = {
  name: string;
  display_name: string;
  plan: string;
  member_count: number;
};

export type ApiOrgMember = {
  username: string;
  display_name: string;
  title: string | null;
  avatar_initials: string | null;
  role: string;
};

export type ApiTeam = {
  slug: string;
  name: string;
  description: string | null;
  members: string[];
};

export type ApiBranch = {
  name: string;
  head_revision: string;
  is_default: boolean;
  updated_at: string;
};

export type ApiLock = {
  path: string;
  owner_username: string | null;
  lock_type: string;
  note: string | null;
  acquired_at: string;
};
