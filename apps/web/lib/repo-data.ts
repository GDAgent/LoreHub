/**
 * Repository data access — live API only.
 *
 * Every function calls the LoreHub API. When the API is unreachable a read
 * returns an empty list (or null for a single resource) so pages render an
 * honest empty state rather than fabricated demo data.
 */

import {
  apiGet,
  type ApiBranch,
  type ApiChangeRequestDetail,
  type ApiChangeRequestListItem,
  type ApiIssueDetail,
  type ApiIssueListItem,
  type ApiLock,
} from "@/lib/api";

export type IssueRow = {
  number: number;
  title: string;
  state: string;
  labels: string[];
  author: string;
  createdAt: string;
  milestone?: string;
  commentCount: number;
};

export type IssueDetailData = {
  number: number;
  title: string;
  state: string;
  labels: string[];
  assignees: string[];
  milestone?: string;
  author: string;
  createdAt: string;
  body: string;
  comments: { author: string; body: string; createdAt: string }[];
};

export type ChangeRequestRow = {
  number: number;
  title: string;
  state: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  labels: string[];
  approvals: number;
  createdAt: string;
};

export type CrReview = {
  reviewer: string;
  state: string;
  body: string;
  createdAt: string;
};

export type CrComment = {
  author: string;
  body: string;
  createdAt: string;
};

export type CrInlineThread = {
  filePath: string;
  line: number;
  resolved: boolean;
  comments: CrComment[];
};

export type ChangeRequestDetailData = {
  number: number;
  title: string;
  state: string;
  body: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  baseRevision: string | null;
  headRevision: string | null;
  mergeRevision: string | null;
  createdAt: string;
  mergedAt: string | null;
  labels: string[];
  reviewers: string[];
  linkedIssues: number[];
  reviews: CrReview[];
  comments: CrComment[];
  inlineThreads: CrInlineThread[];
  approvals: number;
  requiredApprovals: number;
};

export type BranchRow = {
  name: string;
  headRevision: string;
  isDefault: boolean;
  updatedAt: string;
};

export type LockRow = {
  path: string;
  owner: string;
  lockType: string;
  note: string | null;
  acquiredAt: string;
};

function encode(org: string, repo: string) {
  return `${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`;
}

export async function getIssues(org: string, repo: string): Promise<IssueRow[]> {
  const live = await apiGet<ApiIssueListItem[]>(`/api/v1/orgs/${encode(org, repo)}/issues`);
  if (!live) {
    return [];
  }
  return live.map((issue) => ({
    number: issue.number,
    title: issue.title,
    state: issue.state,
    labels: issue.labels,
    author: issue.author_username ?? "unknown",
    createdAt: issue.created_at,
    commentCount: 0,
  }));
}

export async function getIssueDetail(
  org: string,
  repo: string,
  number: number,
): Promise<IssueDetailData | null> {
  const live = await apiGet<ApiIssueDetail>(`/api/v1/orgs/${encode(org, repo)}/issues/${number}`);
  if (!live) {
    return null;
  }
  return {
    number: live.number,
    title: live.title,
    state: live.state,
    labels: live.labels,
    assignees: live.assignees,
    author: live.author_username ?? "unknown",
    createdAt: live.created_at,
    body: live.body,
    comments: live.comments.map((comment) => ({
      author: comment.author_username ?? "unknown",
      body: comment.body,
      createdAt: comment.created_at,
    })),
  };
}

export async function getChangeRequests(
  org: string,
  repo: string,
): Promise<ChangeRequestRow[]> {
  const live = await apiGet<ApiChangeRequestListItem[]>(
    `/api/v1/orgs/${encode(org, repo)}/change-requests`,
  );
  if (!live) {
    return [];
  }
  return live.map((cr) => ({
    number: cr.number,
    title: cr.title,
    state: cr.state,
    author: cr.author_username ?? "unknown",
    sourceBranch: cr.source_branch,
    targetBranch: cr.target_branch,
    labels: cr.labels,
    approvals: cr.approvals,
    createdAt: cr.created_at,
  }));
}

export async function getChangeRequestDetail(
  org: string,
  repo: string,
  number: number,
): Promise<ChangeRequestDetailData | null> {
  const live = await apiGet<ApiChangeRequestDetail>(
    `/api/v1/orgs/${encode(org, repo)}/change-requests/${number}`,
  );
  if (!live) {
    return null;
  }
  return {
    number: live.number,
    title: live.title,
    state: live.state,
    body: live.body,
    author: live.author_username ?? "unknown",
    sourceBranch: live.source_branch,
    targetBranch: live.target_branch,
    baseRevision: live.base_revision,
    headRevision: live.head_revision,
    mergeRevision: live.merge_revision,
    createdAt: live.created_at,
    mergedAt: live.merged_at,
    labels: live.labels,
    reviewers: live.reviewers,
    linkedIssues: live.linked_issues,
    reviews: live.reviews.map((review) => ({
      reviewer: review.reviewer_username ?? "unknown",
      state: review.state,
      body: review.body,
      createdAt: review.created_at,
    })),
    comments: live.comments.map((comment) => ({
      author: comment.author_username ?? "unknown",
      body: comment.body,
      createdAt: comment.created_at,
    })),
    inlineThreads: live.inline_threads.map((thread) => ({
      filePath: thread.file_path,
      line: thread.line,
      resolved: thread.resolved,
      comments: thread.comments.map((comment) => ({
        author: comment.author_username ?? "unknown",
        body: comment.body,
        createdAt: comment.created_at,
      })),
    })),
    approvals: live.approvals,
    requiredApprovals: live.required_approvals,
  };
}

export async function getBranches(org: string, repo: string): Promise<BranchRow[]> {
  const live = await apiGet<ApiBranch[]>(`/api/v1/orgs/${encode(org, repo)}/branches`);
  if (!live) {
    return [];
  }
  return live.map((branch) => ({
    name: branch.name,
    headRevision: branch.head_revision,
    isDefault: branch.is_default,
    updatedAt: branch.updated_at,
  }));
}

export async function getLocks(org: string, repo: string): Promise<LockRow[]> {
  const live = await apiGet<ApiLock[]>(`/api/v1/orgs/${encode(org, repo)}/locks`);
  if (!live) {
    return [];
  }
  return live.map((lock) => ({
    path: lock.path,
    owner: lock.owner_username ?? "unknown",
    lockType: lock.lock_type,
    note: lock.note,
    acquiredAt: lock.acquired_at,
  }));
}
