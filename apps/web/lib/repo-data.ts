/**
 * Repository data access with graceful fallback.
 *
 * Each function tries the live API first and falls back to the demo modules so
 * the UI keeps rendering whether or not the backend is running. The `live` flag
 * tells the page which source was used (handy for a subtle indicator).
 */

import {
  apiGet,
  type ApiChangeRequestListItem,
  type ApiIssueDetail,
  type ApiIssueListItem,
} from "@/lib/api";
import {
  getIssue as demoGetIssue,
  getUser,
  listChangeRequests as demoListChangeRequests,
  listIssues as demoListIssues,
} from "@/lib/demo-collaboration";

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
  createdAt: string;
};

export type Sourced<T> = { data: T; live: boolean };

function encode(org: string, repo: string) {
  return `${encodeURIComponent(org)}/repos/${encodeURIComponent(repo)}`;
}

export async function getIssues(org: string, repo: string): Promise<Sourced<IssueRow[]>> {
  const live = await apiGet<ApiIssueListItem[]>(`/api/v1/orgs/${encode(org, repo)}/issues`);
  if (live) {
    return {
      live: true,
      data: live.map((issue) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        labels: issue.labels,
        author: issue.author_username ?? "unknown",
        createdAt: issue.created_at,
        commentCount: 0,
      })),
    };
  }

  return {
    live: false,
    data: demoListIssues().map((issue) => ({
      number: issue.number,
      title: issue.title,
      state: issue.state,
      labels: issue.labels,
      author: getUser(issue.author)?.name ?? issue.author,
      createdAt: issue.createdAt,
      milestone: issue.milestone,
      commentCount: issue.comments.length,
    })),
  };
}

export async function getIssueDetail(
  org: string,
  repo: string,
  number: number,
): Promise<Sourced<IssueDetailData> | null> {
  const live = await apiGet<ApiIssueDetail>(`/api/v1/orgs/${encode(org, repo)}/issues/${number}`);
  if (live) {
    return {
      live: true,
      data: {
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
      },
    };
  }

  const demo = demoGetIssue(number);
  if (!demo) {
    return null;
  }
  return {
    live: false,
    data: {
      number: demo.number,
      title: demo.title,
      state: demo.state,
      labels: demo.labels,
      assignees: demo.assignees.map((assignee) => getUser(assignee)?.name ?? assignee),
      milestone: demo.milestone,
      author: getUser(demo.author)?.name ?? demo.author,
      createdAt: demo.createdAt,
      body: demo.body,
      comments: demo.comments.map((comment) => ({
        author: getUser(comment.author)?.name ?? comment.author,
        body: comment.body,
        createdAt: comment.createdAt,
      })),
    },
  };
}

export async function getChangeRequests(
  org: string,
  repo: string,
): Promise<Sourced<ChangeRequestRow[]>> {
  const live = await apiGet<ApiChangeRequestListItem[]>(
    `/api/v1/orgs/${encode(org, repo)}/change-requests`,
  );
  if (live) {
    return {
      live: true,
      data: live.map((cr) => ({
        number: cr.number,
        title: cr.title,
        state: cr.state,
        author: cr.author_username ?? "unknown",
        sourceBranch: cr.source_branch,
        targetBranch: cr.target_branch,
        createdAt: cr.created_at,
      })),
    };
  }

  return {
    live: false,
    data: demoListChangeRequests().map((cr) => ({
      number: cr.number,
      title: cr.title,
      state: cr.state,
      author: getUser(cr.author)?.name ?? cr.author,
      sourceBranch: cr.sourceBranch,
      targetBranch: cr.targetBranch,
      createdAt: cr.createdAt,
    })),
  };
}
