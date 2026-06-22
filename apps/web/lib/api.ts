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
  created_at: string;
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
