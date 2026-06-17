export type DemoRole = "Owner" | "Maintainer" | "Developer" | "Reporter" | "Guest";

export type DemoUser = {
  username: string;
  name: string;
  email: string;
  title: string;
};

export type DemoComment = {
  id: string;
  author: string;
  createdAt: string;
  body: string;
};

export type DemoIssue = {
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  author: string;
  createdAt: string;
  labels: string[];
  assignees: string[];
  milestone?: string;
  comments: DemoComment[];
};

export type DemoInlineThread = {
  id: string;
  filePath: string;
  line: number;
  status: "open" | "resolved";
  comments: DemoComment[];
};

export type DemoReview = {
  reviewer: string;
  state: "approved" | "commented" | "requested";
  createdAt: string;
  body: string;
};

export type DemoChangeRequest = {
  number: number;
  title: string;
  body: string;
  state: "draft" | "open" | "merged";
  author: string;
  createdAt: string;
  sourceBranch: string;
  targetBranch: string;
  baseRevision: string;
  headRevision: string;
  mergeRevision?: string;
  labels: string[];
  reviewers: string[];
  linkedIssues: number[];
  comments: DemoComment[];
  inlineThreads: DemoInlineThread[];
  reviews: DemoReview[];
};

export type DemoNotification = {
  id: string;
  kind: "mention" | "issue" | "review" | "team" | "permission";
  title: string;
  body: string;
  createdAt: string;
  href: string;
  read: boolean;
  emailStatus: "sent" | "queued";
};

export type DemoTeam = {
  slug: string;
  name: string;
  description: string;
  members: string[];
  maintainers: string[];
  defaultReviewersFor: string[];
};

export type DemoMember = {
  username: string;
  orgRole: DemoRole;
  repoRole: DemoRole;
  teams: string[];
};

export const demoUsers: DemoUser[] = [
  {
    username: "rin",
    name: "Rin Tanaka",
    email: "rin@studio.dev",
    title: "Gameplay Engineer",
  },
  {
    username: "maya",
    name: "Maya Solis",
    email: "maya@studio.dev",
    title: "Tech Lead",
  },
  {
    username: "iris",
    name: "Iris Bennett",
    email: "iris@studio.dev",
    title: "Principal Environment Artist",
  },
  {
    username: "omar",
    name: "Omar Haddad",
    email: "omar@studio.dev",
    title: "Producer",
  },
];

export const demoIssues: DemoIssue[] = [
  {
    number: 12,
    title: "HUD toast stack overflows during fast wave transitions",
    body:
      "Wave-complete notifications stack over each other after r:f34ab29. @maya asked that we track this before !7 merges fully into the release branch. Related follow-up: #14.",
    state: "open",
    author: "rin",
    createdAt: "2026-06-17T09:12:00Z",
    labels: ["bug", "ui", "priority:high"],
    assignees: ["maya", "rin"],
    milestone: "Vertical Slice Alpha",
    comments: [
      {
        id: "issue-12-comment-1",
        author: "maya",
        createdAt: "2026-06-17T09:25:00Z",
        body: "Confirmed locally. The regression likely came from the toast counter added in r:f34ab29. Please keep !7 blocked until this is handled.",
      },
      {
        id: "issue-12-comment-2",
        author: "omar",
        createdAt: "2026-06-17T10:10:00Z",
        body: "Tagging @iris so art review knows the HUD capture in !7 is not final yet.",
      },
    ],
  },
  {
    number: 14,
    title: "Material review checklist should live beside the active change request",
    body:
      "The current art checklist is useful, but reviewers keep missing it. Link it from !7 and mention @iris on the CR description so the art team gets a clear handoff.",
    state: "open",
    author: "iris",
    createdAt: "2026-06-17T08:05:00Z",
    labels: ["art", "documentation"],
    assignees: ["iris"],
    milestone: "Vertical Slice Alpha",
    comments: [
      {
        id: "issue-14-comment-1",
        author: "maya",
        createdAt: "2026-06-17T08:45:00Z",
        body: "Agreed. We should cross-link #12 and !7 so reviewers can move between the problem report and the change discussion.",
      },
    ],
  },
  {
    number: 16,
    title: "Close the hard-mode balancing thread once !6 lands",
    body:
      "Tracking closure for the gameplay pacing thread. Once !6 merges and the metrics are green, this issue can be closed automatically.",
    state: "closed",
    author: "omar",
    createdAt: "2026-06-16T13:20:00Z",
    labels: ["gameplay", "tracking"],
    assignees: ["rin"],
    comments: [
      {
        id: "issue-16-comment-1",
        author: "rin",
        createdAt: "2026-06-16T16:40:00Z",
        body: "Resolved by !6. Leaving the thread here for future balancing references.",
      },
    ],
  },
];

export const demoChangeRequests: DemoChangeRequest[] = [
  {
    number: 6,
    title: "Tune hard-mode pacing for combat arenas",
    body:
      "Balances wave progression, updates the scoreboard messaging, and closes #16. Please review the gameplay pacing notes before merge.",
    state: "merged",
    author: "rin",
    createdAt: "2026-06-16T15:02:00Z",
    sourceBranch: "feature/hard-mode",
    targetBranch: "main",
    baseRevision: "d12e4419ba72",
    headRevision: "7c91ae447bc2",
    mergeRevision: "f34ab29ce810",
    labels: ["gameplay"],
    reviewers: ["maya"],
    linkedIssues: [16],
    comments: [
      {
        id: "cr-6-comment-1",
        author: "maya",
        createdAt: "2026-06-16T16:10:00Z",
        body: "Approved after checking the wave pacing against the latest combat metrics.",
      },
    ],
    inlineThreads: [
      {
        id: "cr-6-thread-1",
        filePath: "Source/LoreHub/GameMode.cpp",
        line: 12,
        status: "resolved",
        comments: [
          {
            id: "cr-6-thread-1-comment-1",
            author: "maya",
            createdAt: "2026-06-16T15:30:00Z",
            body: "Nice. This keeps the escalation readable even with the higher enemy count.",
          },
        ],
      },
    ],
    reviews: [
      {
        reviewer: "maya",
        state: "approved",
        createdAt: "2026-06-16T16:10:00Z",
        body: "Gameplay reads clearly and the scoreboard pacing looks good.",
      },
    ],
  },
  {
    number: 7,
    title: "Polish hero corridor material pass and review checklist",
    body:
      "Moves the environment material work toward main, references #14, and keeps #12 visible because the HUD captures are still affected. @iris is the primary reviewer.",
    state: "open",
    author: "iris",
    createdAt: "2026-06-17T11:20:00Z",
    sourceBranch: "art/material-pass",
    targetBranch: "main",
    baseRevision: "7c91ae447bc2",
    headRevision: "f34ab29ce810",
    labels: ["art", "review-needed"],
    reviewers: ["maya", "rin"],
    linkedIssues: [12, 14],
    comments: [
      {
        id: "cr-7-comment-1",
        author: "iris",
        createdAt: "2026-06-17T11:32:00Z",
        body: "The art checklist now lives in docs/art-review.md and should be part of every review pass for this branch.",
      },
      {
        id: "cr-7-comment-2",
        author: "maya",
        createdAt: "2026-06-17T12:05:00Z",
        body: "Leaving this open until #12 is resolved, but the material work itself looks good.",
      },
    ],
    inlineThreads: [
      {
        id: "cr-7-thread-1",
        filePath: "docs/roadmap.md",
        line: 7,
        status: "open",
        comments: [
          {
            id: "cr-7-thread-1-comment-1",
            author: "maya",
            createdAt: "2026-06-17T11:48:00Z",
            body: "Please mention #14 explicitly here so reviewers can jump straight to the issue discussion.",
          },
        ],
      },
      {
        id: "cr-7-thread-2",
        filePath: "Source/LoreHub/HUD.cpp",
        line: 4,
        status: "open",
        comments: [
          {
            id: "cr-7-thread-2-comment-1",
            author: "rin",
            createdAt: "2026-06-17T12:12:00Z",
            body: "This line still interacts with #12, so we should call out the dependency in the merge plan.",
          },
        ],
      },
    ],
    reviews: [
      {
        reviewer: "maya",
        state: "commented",
        createdAt: "2026-06-17T12:05:00Z",
        body: "Material quality is good. Waiting on the HUD fix before approval.",
      },
    ],
  },
  {
    number: 8,
    title: "Draft co-op scoreboard refactor",
    body:
      "Draft CR for a larger scoreboard rewrite. Kept in draft so the team can discuss architecture and mentions like @maya without triggering final review yet.",
    state: "draft",
    author: "rin",
    createdAt: "2026-06-17T14:10:00Z",
    sourceBranch: "feature/co-op-scoreboard",
    targetBranch: "main",
    baseRevision: "f34ab29ce810",
    headRevision: "f34ab29ce810",
    labels: ["draft", "ui"],
    reviewers: ["maya"],
    linkedIssues: [12],
    comments: [],
    inlineThreads: [],
    reviews: [],
  },
];

export const demoNotifications: DemoNotification[] = [
  {
    id: "notif-1",
    kind: "mention",
    title: "Maya mentioned you in issue #12",
    body: "Confirmed locally. The regression likely came from the toast counter added in r:f34ab29.",
    createdAt: "2026-06-17T09:25:00Z",
    href: "/acme/demo/issues/12",
    read: false,
    emailStatus: "sent",
  },
  {
    id: "notif-2",
    kind: "review",
    title: "Review requested on !7",
    body: "@iris is the primary reviewer, and @maya asked for a final pass before merge.",
    createdAt: "2026-06-17T11:22:00Z",
    href: "/acme/demo/cr/7",
    read: false,
    emailStatus: "sent",
  },
  {
    id: "notif-3",
    kind: "team",
    title: "Art Reviewers team was added to repo protections",
    body: "The default reviewers for art-heavy changes now include @iris and the Art Reviewers team.",
    createdAt: "2026-06-17T12:40:00Z",
    href: "/acme/teams",
    read: true,
    emailStatus: "queued",
  },
  {
    id: "notif-4",
    kind: "permission",
    title: "Your repo role changed to Maintainer",
    body: "You can now triage issues, review !7, and manage labels in the demo repository.",
    createdAt: "2026-06-17T13:15:00Z",
    href: "/acme/demo/settings",
    read: true,
    emailStatus: "sent",
  },
];

export const demoTeams: DemoTeam[] = [
  {
    slug: "engine",
    name: "Engine",
    description: "Owns gameplay code, branch protections, and runtime regressions.",
    members: ["maya", "rin"],
    maintainers: ["maya"],
    defaultReviewersFor: ["demo"],
  },
  {
    slug: "art-reviewers",
    name: "Art Reviewers",
    description: "Reviews binary-heavy CRs and validates asset checklists.",
    members: ["iris", "omar"],
    maintainers: ["iris"],
    defaultReviewersFor: ["demo"],
  },
];

export const demoMembers: DemoMember[] = [
  {
    username: "maya",
    orgRole: "Owner",
    repoRole: "Owner",
    teams: ["engine"],
  },
  {
    username: "rin",
    orgRole: "Developer",
    repoRole: "Maintainer",
    teams: ["engine"],
  },
  {
    username: "iris",
    orgRole: "Maintainer",
    repoRole: "Maintainer",
    teams: ["art-reviewers"],
  },
  {
    username: "omar",
    orgRole: "Reporter",
    repoRole: "Reporter",
    teams: ["art-reviewers"],
  },
];

export const permissionMatrix = [
  {
    capability: "Manage members and teams",
    Owner: true,
    Maintainer: false,
    Developer: false,
    Reporter: false,
    Guest: false,
  },
  {
    capability: "Create and triage issues",
    Owner: true,
    Maintainer: true,
    Developer: true,
    Reporter: true,
    Guest: false,
  },
  {
    capability: "Comment and review change requests",
    Owner: true,
    Maintainer: true,
    Developer: true,
    Reporter: true,
    Guest: false,
  },
  {
    capability: "Push protected branches",
    Owner: true,
    Maintainer: true,
    Developer: false,
    Reporter: false,
    Guest: false,
  },
  {
    capability: "Merge approved change requests",
    Owner: true,
    Maintainer: true,
    Developer: false,
    Reporter: false,
    Guest: false,
  },
];

export function getUser(username: string) {
  return demoUsers.find((user) => user.username === username);
}

export function listIssues(options?: { query?: string; state?: string; label?: string }) {
  return demoIssues.filter((issue) => {
    if (options?.state && options.state !== "all" && issue.state !== options.state) {
      return false;
    }

    if (options?.label && options.label !== "all" && !issue.labels.includes(options.label)) {
      return false;
    }

    if (options?.query) {
      const query = options.query.toLowerCase();
      const haystack = `${issue.title} ${issue.body} ${issue.labels.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    }

    return true;
  });
}

export function getIssue(number: number) {
  return demoIssues.find((issue) => issue.number === number);
}

export function buildCreatedIssue(input: {
  title: string;
  body: string;
  labels?: string;
  assignees?: string;
}) {
  const labels = splitList(input.labels);
  const assignees = splitList(input.assignees);

  return {
    number: 18,
    title: input.title.trim(),
    body: input.body.trim(),
    state: "open",
    author: "maya",
    createdAt: "2026-06-17T18:55:00Z",
    labels,
    assignees,
    milestone: "Vertical Slice Alpha",
    comments: [],
  } satisfies DemoIssue;
}

export function applyIssueActions(
  issue: DemoIssue,
  options: { action?: string; commentBody?: string; label?: string },
) {
  const labels = issue.labels.includes(options.label ?? "") || !options.label
    ? issue.labels
    : [...issue.labels, options.label];

  const comments = options.commentBody?.trim()
    ? [
        ...issue.comments,
        {
          id: `${issue.number}-draft-comment`,
          author: "maya",
          createdAt: "2026-06-17T19:00:00Z",
          body: options.commentBody.trim(),
        },
      ]
    : issue.comments;

  return {
    ...issue,
    state: options.action === "close" ? "closed" : options.action === "reopen" ? "open" : issue.state,
    labels,
    comments,
  } satisfies DemoIssue;
}

export function listChangeRequests(options?: { query?: string; state?: string }) {
  return demoChangeRequests.filter((changeRequest) => {
    if (options?.state && options.state !== "all" && changeRequest.state !== options.state) {
      return false;
    }

    if (options?.query) {
      const query = options.query.toLowerCase();
      const haystack = `${changeRequest.title} ${changeRequest.body} ${changeRequest.labels.join(" ")}`.toLowerCase();
      return haystack.includes(query);
    }

    return true;
  });
}

export function getChangeRequest(number: number) {
  return demoChangeRequests.find((changeRequest) => changeRequest.number === number);
}

export function buildCreatedChangeRequest(input: {
  title: string;
  body: string;
  sourceBranch: string;
  targetBranch: string;
}) {
  return {
    number: 9,
    title: input.title.trim(),
    body: input.body.trim(),
    state: "open",
    author: "maya",
    createdAt: "2026-06-17T19:05:00Z",
    sourceBranch: input.sourceBranch.trim() || "feature/new-work",
    targetBranch: input.targetBranch.trim() || "main",
    baseRevision: "f34ab29ce810",
    headRevision: "f34ab29ce810",
    labels: ["review-needed"],
    reviewers: ["rin"],
    linkedIssues: [12],
    comments: [],
    inlineThreads: [],
    reviews: [],
  } satisfies DemoChangeRequest;
}

export function applyChangeRequestActions(
  changeRequest: DemoChangeRequest,
  options: {
    review?: string;
    commentBody?: string;
    inlineComment?: string;
    inlinePath?: string;
    inlineLine?: string;
  },
) {
  const comments = options.commentBody?.trim()
    ? [
        ...changeRequest.comments,
        {
          id: `${changeRequest.number}-draft-comment`,
          author: "maya",
          createdAt: "2026-06-17T19:10:00Z",
          body: options.commentBody.trim(),
        },
      ]
    : changeRequest.comments;

  const reviews =
    options.review === "approve"
      ? [
          ...changeRequest.reviews,
          {
            reviewer: "maya",
            state: "approved",
            createdAt: "2026-06-17T19:10:00Z",
            body: "Approved from the Phase 2 review flow.",
          } satisfies DemoReview,
        ]
      : changeRequest.reviews;

  const inlineThreads = options.inlineComment?.trim() && options.inlinePath && options.inlineLine
    ? [
        ...changeRequest.inlineThreads,
        {
          id: `${changeRequest.number}-draft-inline`,
          filePath: options.inlinePath,
          line: Number(options.inlineLine),
          status: "open",
          comments: [
            {
              id: `${changeRequest.number}-draft-inline-comment`,
              author: "maya",
              createdAt: "2026-06-17T19:11:00Z",
              body: options.inlineComment.trim(),
            },
          ],
        } satisfies DemoInlineThread,
      ]
    : changeRequest.inlineThreads;

  return {
    ...changeRequest,
    state: options.review === "merge" ? "merged" : changeRequest.state,
    mergeRevision: options.review === "merge" ? "f34ab29ce810" : changeRequest.mergeRevision,
    comments,
    reviews,
    inlineThreads,
  } satisfies DemoChangeRequest;
}

export function listNotifications(filter?: string) {
  return demoNotifications.filter((notification) => {
    if (!filter || filter === "all") {
      return true;
    }

    if (filter === "unread") {
      return !notification.read;
    }

    if (filter === "email") {
      return true;
    }

    return notification.kind === filter;
  });
}

export function buildCreatedTeam(input: { name: string; description?: string; members?: string }) {
  const name = input.name.trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return {
    slug,
    name,
    description: input.description?.trim() || "New team created from the Phase 2 collaboration shell.",
    members: splitList(input.members),
    maintainers: ["maya"],
    defaultReviewersFor: ["demo"],
  } satisfies DemoTeam;
}

function splitList(value?: string) {
  return value
    ?.split(",")
    .map((item) => item.trim().replace(/^@/, ""))
    .filter(Boolean) ?? [];
}
