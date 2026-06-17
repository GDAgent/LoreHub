export type DemoRevision = {
  hash: string;
  shortHash: string;
  title: string;
  description: string;
  author: string;
  authoredAt: string;
  parents: string[];
  branchTags: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
};

export type DemoBranch = {
  name: string;
  head: string;
  updatedAt: string;
  isDefault?: boolean;
  summary: string;
  isNew?: boolean;
};

type DirectoryNode = {
  kind: "directory";
  children: string[];
};

type TextNode = {
  kind: "text";
  language: string;
  content: string;
  size: number;
};

type BinaryNode = {
  kind: "binary";
  mimeType: string;
  size: number;
  description: string;
};

type RepoNode = DirectoryNode | TextNode | BinaryNode;

export type DemoTreeEntry = {
  kind: "directory" | "text" | "binary";
  name: string;
  path: string;
  size?: number;
  language?: string;
  mimeType?: string;
};

export type DemoDiffLine = {
  kind: "context" | "add" | "remove";
  oldNumber?: number;
  newNumber?: number;
  text: string;
};

export type DemoSplitDiffLine = {
  left?: {
    kind: "context" | "remove";
    number?: number;
    text: string;
  };
  right?: {
    kind: "context" | "add";
    number?: number;
    text: string;
  };
};

export type DemoDiffFile = {
  path: string;
  language: string;
  summary: string;
  unified: DemoDiffLine[];
  split: DemoSplitDiffLine[];
};

export type DemoDiff = {
  base: string;
  head: string;
  files: DemoDiffFile[];
};

export const demoRevisions: DemoRevision[] = [
  {
    hash: "f34ab29ce810",
    shortHash: "f34ab29",
    title: "Merge material polish into mainline",
    description:
      "Brings the updated environment material pass onto main and refreshes the repository landing docs.",
    author: "Maya Solis",
    authoredAt: "2026-06-17T13:40:00Z",
    parents: ["7c91ae447bc2", "b52fd9aa8c3e"],
    branchTags: ["main"],
    filesChanged: 4,
    insertions: 41,
    deletions: 11,
  },
  {
    hash: "b52fd9aa8c3e",
    shortHash: "b52fd9a",
    title: "Polish material pass for hero corridor",
    description:
      "Adds the latest material asset and notes the art-specific review checklist for binary changes.",
    author: "Iris Bennett",
    authoredAt: "2026-06-17T10:05:00Z",
    parents: ["7c91ae447bc2"],
    branchTags: ["art/material-pass"],
    filesChanged: 2,
    insertions: 15,
    deletions: 3,
  },
  {
    hash: "7c91ae447bc2",
    shortHash: "7c91ae4",
    title: "Tune wave pacing and scoreboard output",
    description:
      "Updates the core gameplay loop and exposes a smaller sample tree for browser validation.",
    author: "Rin Tanaka",
    authoredAt: "2026-06-16T18:20:00Z",
    parents: ["d12e4419ba72"],
    branchTags: ["feature/hard-mode"],
    filesChanged: 3,
    insertions: 28,
    deletions: 6,
  },
  {
    hash: "d12e4419ba72",
    shortHash: "d12e441",
    title: "Seed initial playable repository sample",
    description:
      "Establishes the first LoreHub demo repository with source, docs, and binary assets.",
    author: "Rin Tanaka",
    authoredAt: "2026-06-15T09:30:00Z",
    parents: [],
    branchTags: ["bootstrap"],
    filesChanged: 6,
    insertions: 82,
    deletions: 0,
  },
];

export const demoBranches: DemoBranch[] = [
  {
    name: "main",
    head: "f34ab29ce810",
    updatedAt: "2 hours ago",
    isDefault: true,
    summary: "Stable integration branch for playable builds.",
  },
  {
    name: "art/material-pass",
    head: "b52fd9aa8c3e",
    updatedAt: "5 hours ago",
    summary: "Binary-heavy branch for environment material polish.",
  },
  {
    name: "feature/hard-mode",
    head: "7c91ae447bc2",
    updatedAt: "1 day ago",
    summary: "Gameplay iteration branch for combat tuning and pacing.",
  },
];

type SnapshotMap = Record<string, Record<string, RepoNode>>;

const snapshots: SnapshotMap = {
  "d12e4419ba72": {
    "": { kind: "directory", children: ["README.md", "docs", "Source", "Content"] },
    "README.md": {
      kind: "text",
      language: "markdown",
      size: 198,
      content: `# Demo Repository\n\nThis sample project exists so LoreHub can validate revision browsing, file viewing, and branch-aware navigation before the real Lore integration is in place.\n`,
    },
    docs: { kind: "directory", children: ["roadmap.md"] },
    "docs/roadmap.md": {
      kind: "text",
      language: "markdown",
      size: 226,
      content: `# Vertical Slice Roadmap\n\n- Validate repository creation flow\n- Stand up file browser shell\n- Add binary preview placeholders for art review\n`,
    },
    Source: { kind: "directory", children: ["LoreHub"] },
    "Source/LoreHub": { kind: "directory", children: ["GameMode.cpp", "HUD.cpp"] },
    "Source/LoreHub/GameMode.cpp": {
      kind: "text",
      language: "cpp",
      size: 384,
      content: `#include "GameMode.h"\n\nvoid ALoreHubGameMode::BeginPlay()\n{\n    CurrentWave = 1;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::AnnounceWave(int32 WaveNumber)\n{\n    BroadcastToHud(FString::Printf(TEXT("Wave %d starting"), WaveNumber));\n}\n`,
    },
    "Source/LoreHub/HUD.cpp": {
      kind: "text",
      language: "cpp",
      size: 221,
      content: `#include "HUD.h"\n\nvoid ALoreHubHud::SetStatus(const FString& Message)\n{\n    LatestStatus = Message;\n}\n`,
    },
    Content: { kind: "directory", children: ["Characters"] },
    "Content/Characters": { kind: "directory", children: ["Hero.uasset"] },
    "Content/Characters/Hero.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 2781184,
      description: "Binary Unreal asset for the playable hero mesh.",
    },
  },
  "7c91ae447bc2": {
    "": { kind: "directory", children: ["README.md", "docs", "Source", "Content"] },
    "README.md": {
      kind: "text",
      language: "markdown",
      size: 274,
      content: `# Demo Repository\n\nThis sample project exists so LoreHub can validate revision browsing, file viewing, and branch-aware navigation before the real Lore integration is in place.\n\nUse the repository browser to inspect source files, binary assets, and revision history from a single surface.\n`,
    },
    docs: { kind: "directory", children: ["roadmap.md"] },
    "docs/roadmap.md": {
      kind: "text",
      language: "markdown",
      size: 303,
      content: `# Vertical Slice Roadmap\n\n- Validate repository creation flow\n- Stand up file browser shell\n- Add binary preview placeholders for art review\n- Expose revision graph and branch summaries\n`,
    },
    Source: { kind: "directory", children: ["LoreHub"] },
    "Source/LoreHub": { kind: "directory", children: ["GameMode.cpp", "HUD.cpp"] },
    "Source/LoreHub/GameMode.cpp": {
      kind: "text",
      language: "cpp",
      size: 502,
      content: `#include "GameMode.h"\n\nvoid ALoreHubGameMode::BeginPlay()\n{\n    CurrentWave = 1;\n    MaxSimultaneousEnemies = 8;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::CompleteWave()\n{\n    CurrentWave += 1;\n    MaxSimultaneousEnemies += 2;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::AnnounceWave(int32 WaveNumber)\n{\n    BroadcastToHud(FString::Printf(TEXT("Wave %d ready | %d enemies"), WaveNumber, MaxSimultaneousEnemies));\n}\n`,
    },
    "Source/LoreHub/HUD.cpp": {
      kind: "text",
      language: "cpp",
      size: 289,
      content: `#include "HUD.h"\n\nvoid ALoreHubHud::SetStatus(const FString& Message)\n{\n    LatestStatus = FString::Printf(TEXT("[Arena] %s"), *Message);\n}\n`,
    },
    Content: { kind: "directory", children: ["Characters"] },
    "Content/Characters": { kind: "directory", children: ["Hero.uasset"] },
    "Content/Characters/Hero.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 2781184,
      description: "Binary Unreal asset for the playable hero mesh.",
    },
  },
  "b52fd9aa8c3e": {
    "": { kind: "directory", children: ["README.md", "docs", "Source", "Content"] },
    "README.md": {
      kind: "text",
      language: "markdown",
      size: 291,
      content: `# Demo Repository\n\nThis sample project exists so LoreHub can validate revision browsing, file viewing, and branch-aware navigation before the real Lore integration is in place.\n\nMaterial review is using binary placeholders until the real Lore asset transport is connected.\n`,
    },
    docs: { kind: "directory", children: ["roadmap.md", "art-review.md"] },
    "docs/roadmap.md": {
      kind: "text",
      language: "markdown",
      size: 303,
      content: `# Vertical Slice Roadmap\n\n- Validate repository creation flow\n- Stand up file browser shell\n- Add binary preview placeholders for art review\n- Expose revision graph and branch summaries\n`,
    },
    "docs/art-review.md": {
      kind: "text",
      language: "markdown",
      size: 214,
      content: `# Art Review Checklist\n\n- Verify material compile warnings\n- Confirm texture memory budget\n- Attach turntable capture in the change request\n`,
    },
    Source: { kind: "directory", children: ["LoreHub"] },
    "Source/LoreHub": { kind: "directory", children: ["GameMode.cpp", "HUD.cpp"] },
    "Source/LoreHub/GameMode.cpp": {
      kind: "text",
      language: "cpp",
      size: 502,
      content: `#include "GameMode.h"\n\nvoid ALoreHubGameMode::BeginPlay()\n{\n    CurrentWave = 1;\n    MaxSimultaneousEnemies = 8;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::CompleteWave()\n{\n    CurrentWave += 1;\n    MaxSimultaneousEnemies += 2;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::AnnounceWave(int32 WaveNumber)\n{\n    BroadcastToHud(FString::Printf(TEXT("Wave %d ready | %d enemies"), WaveNumber, MaxSimultaneousEnemies));\n}\n`,
    },
    "Source/LoreHub/HUD.cpp": {
      kind: "text",
      language: "cpp",
      size: 289,
      content: `#include "HUD.h"\n\nvoid ALoreHubHud::SetStatus(const FString& Message)\n{\n    LatestStatus = FString::Printf(TEXT("[Arena] %s"), *Message);\n}\n`,
    },
    Content: { kind: "directory", children: ["Characters", "Materials"] },
    "Content/Characters": { kind: "directory", children: ["Hero.uasset"] },
    "Content/Characters/Hero.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 2781184,
      description: "Binary Unreal asset for the playable hero mesh.",
    },
    "Content/Materials": { kind: "directory", children: ["M_HeroCorridor.uasset"] },
    "Content/Materials/M_HeroCorridor.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 842112,
      description: "Binary Unreal material asset for the hero corridor lighting pass.",
    },
  },
  "f34ab29ce810": {
    "": { kind: "directory", children: [".lorehub", "README.md", "docs", "Source", "Content"] },
    ".lorehub": { kind: "directory", children: ["pipeline.yml"] },
    ".lorehub/pipeline.yml": {
      kind: "text",
      language: "yaml",
      size: 872,
      content: `version: 1
name: vertical-slice

triggers:
  push:
    branches: [main, feature/*, art/*]
  change_request:
    types: [opened, updated]

stages:
  - validate
  - build
  - review-artifacts

jobs:
  validate:
    stage: validate
    runner: self-hosted-linux
    steps:
      - lore status --strict
      - cargo test --workspace

  build-demo:
    stage: build
    needs: [validate]
    runner: self-hosted-linux
    sparse:
      - Content/Textures
      - Content/Audio
      - Content/Cinematics
    steps:
      - ./scripts/build-demo.sh
      - lore artifact upload build/demo-windows.zip
`,
    },
    "README.md": {
      kind: "text",
      language: "markdown",
      size: 342,
      content: `# Demo Repository\n\nThis sample project exists so LoreHub can validate revision browsing, file viewing, and branch-aware navigation before the real Lore integration is in place.\n\nUse the repository browser to inspect source files, binary assets, revision history, and the Lore CLI push instructions from a single surface.\n`,
    },
    docs: { kind: "directory", children: ["roadmap.md", "art-review.md"] },
    "docs/roadmap.md": {
      kind: "text",
      language: "markdown",
      size: 364,
      content: `# Vertical Slice Roadmap\n\n- Validate repository creation flow\n- Stand up file browser shell\n- Add binary preview placeholders for art review\n- Expose revision graph and branch summaries\n- Document Lore CLI push flow for creators and reviewers\n`,
    },
    "docs/art-review.md": {
      kind: "text",
      language: "markdown",
      size: 214,
      content: `# Art Review Checklist\n\n- Verify material compile warnings\n- Confirm texture memory budget\n- Attach turntable capture in the change request\n`,
    },
    Source: { kind: "directory", children: ["LoreHub"] },
    "Source/LoreHub": { kind: "directory", children: ["GameMode.cpp", "HUD.cpp"] },
    "Source/LoreHub/GameMode.cpp": {
      kind: "text",
      language: "cpp",
      size: 593,
      content: `#include "GameMode.h"\n\nvoid ALoreHubGameMode::BeginPlay()\n{\n    CurrentWave = 1;\n    MaxSimultaneousEnemies = 8;\n    ScoreboardMode = ELoreScoreboardMode::Compact;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::CompleteWave()\n{\n    CurrentWave += 1;\n    MaxSimultaneousEnemies += 2;\n    ScoreboardMode = ELoreScoreboardMode::Expanded;\n    AnnounceWave(CurrentWave);\n}\n\nvoid ALoreHubGameMode::AnnounceWave(int32 WaveNumber)\n{\n    BroadcastToHud(FString::Printf(TEXT("Wave %d ready | %d enemies"), WaveNumber, MaxSimultaneousEnemies));\n}\n`,
    },
    "Source/LoreHub/HUD.cpp": {
      kind: "text",
      language: "cpp",
      size: 350,
      content: `#include "HUD.h"\n\nvoid ALoreHubHud::SetStatus(const FString& Message)\n{\n    LatestStatus = FString::Printf(TEXT("[Arena] %s"), *Message);\n    PendingToastCount += 1;\n}\n`,
    },
    Content: { kind: "directory", children: ["Characters", "Materials"] },
    "Content/Characters": { kind: "directory", children: ["Hero.uasset"] },
    "Content/Characters/Hero.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 2781184,
      description: "Binary Unreal asset for the playable hero mesh.",
    },
    "Content/Materials": { kind: "directory", children: ["M_HeroCorridor.uasset"] },
    "Content/Materials/M_HeroCorridor.uasset": {
      kind: "binary",
      mimeType: "application/octet-stream",
      size: 842112,
      description: "Binary Unreal material asset for the hero corridor lighting pass.",
    },
  },
};

export const demoDiffs: DemoDiff[] = [
  {
    base: "7c91ae447bc2",
    head: "f34ab29ce810",
    files: [
      {
        path: "Source/LoreHub/GameMode.cpp",
        language: "cpp",
        summary: "Enables compact vs expanded scoreboard modes as the wave count increases.",
        unified: [
          { kind: "context", oldNumber: 3, newNumber: 3, text: "void ALoreHubGameMode::BeginPlay()" },
          { kind: "context", oldNumber: 4, newNumber: 4, text: "{" },
          { kind: "context", oldNumber: 5, newNumber: 5, text: "    CurrentWave = 1;" },
          { kind: "context", oldNumber: 6, newNumber: 6, text: "    MaxSimultaneousEnemies = 8;" },
          { kind: "add", newNumber: 7, text: "    ScoreboardMode = ELoreScoreboardMode::Compact;" },
          { kind: "context", oldNumber: 7, newNumber: 8, text: "    AnnounceWave(CurrentWave);" },
          { kind: "context", oldNumber: 10, newNumber: 11, text: "void ALoreHubGameMode::CompleteWave()" },
          { kind: "context", oldNumber: 11, newNumber: 12, text: "{" },
          { kind: "context", oldNumber: 12, newNumber: 13, text: "    CurrentWave += 1;" },
          { kind: "context", oldNumber: 13, newNumber: 14, text: "    MaxSimultaneousEnemies += 2;" },
          { kind: "add", newNumber: 15, text: "    ScoreboardMode = ELoreScoreboardMode::Expanded;" },
          { kind: "context", oldNumber: 14, newNumber: 16, text: "    AnnounceWave(CurrentWave);" },
        ],
        split: [
          {
            left: { kind: "context", number: 5, text: "    CurrentWave = 1;" },
            right: { kind: "context", number: 5, text: "    CurrentWave = 1;" },
          },
          {
            left: { kind: "context", number: 6, text: "    MaxSimultaneousEnemies = 8;" },
            right: { kind: "context", number: 6, text: "    MaxSimultaneousEnemies = 8;" },
          },
          {
            right: {
              kind: "add",
              number: 7,
              text: "    ScoreboardMode = ELoreScoreboardMode::Compact;",
            },
          },
          {
            left: { kind: "context", number: 13, text: "    MaxSimultaneousEnemies += 2;" },
            right: { kind: "context", number: 14, text: "    MaxSimultaneousEnemies += 2;" },
          },
          {
            right: {
              kind: "add",
              number: 15,
              text: "    ScoreboardMode = ELoreScoreboardMode::Expanded;",
            },
          },
        ],
      },
      {
        path: "docs/roadmap.md",
        language: "markdown",
        summary: "Documents the CLI push flow as part of the Phase 1 rollout.",
        unified: [
          { kind: "context", oldNumber: 3, newNumber: 3, text: "- Validate repository creation flow" },
          { kind: "context", oldNumber: 4, newNumber: 4, text: "- Stand up file browser shell" },
          { kind: "context", oldNumber: 5, newNumber: 5, text: "- Add binary preview placeholders for art review" },
          { kind: "context", oldNumber: 6, newNumber: 6, text: "- Expose revision graph and branch summaries" },
          {
            kind: "add",
            newNumber: 7,
            text: "- Document Lore CLI push flow for creators and reviewers",
          },
        ],
        split: [
          {
            left: { kind: "context", number: 6, text: "- Expose revision graph and branch summaries" },
            right: { kind: "context", number: 6, text: "- Expose revision graph and branch summaries" },
          },
          {
            right: {
              kind: "add",
              number: 7,
              text: "- Document Lore CLI push flow for creators and reviewers",
            },
          },
        ],
      },
    ],
  },
  {
    base: "d12e4419ba72",
    head: "7c91ae447bc2",
    files: [
      {
        path: "Source/LoreHub/GameMode.cpp",
        language: "cpp",
        summary: "Raises enemy count and adds a dedicated wave completion step.",
        unified: [
          { kind: "context", oldNumber: 3, newNumber: 3, text: "void ALoreHubGameMode::BeginPlay()" },
          { kind: "context", oldNumber: 4, newNumber: 4, text: "{" },
          { kind: "context", oldNumber: 5, newNumber: 5, text: "    CurrentWave = 1;" },
          { kind: "add", newNumber: 6, text: "    MaxSimultaneousEnemies = 8;" },
          { kind: "context", oldNumber: 6, newNumber: 7, text: "    AnnounceWave(CurrentWave);" },
          { kind: "add", newNumber: 10, text: "void ALoreHubGameMode::CompleteWave()" },
          { kind: "add", newNumber: 11, text: "{" },
          { kind: "add", newNumber: 12, text: "    CurrentWave += 1;" },
          { kind: "add", newNumber: 13, text: "    MaxSimultaneousEnemies += 2;" },
          { kind: "add", newNumber: 14, text: "    AnnounceWave(CurrentWave);" },
          { kind: "add", newNumber: 15, text: "}" },
        ],
        split: [
          {
            left: { kind: "context", number: 5, text: "    CurrentWave = 1;" },
            right: { kind: "context", number: 5, text: "    CurrentWave = 1;" },
          },
          {
            right: { kind: "add", number: 6, text: "    MaxSimultaneousEnemies = 8;" },
          },
          {
            right: { kind: "add", number: 10, text: "void ALoreHubGameMode::CompleteWave()" },
          },
          {
            right: { kind: "add", number: 11, text: "{" },
          },
          {
            right: { kind: "add", number: 12, text: "    CurrentWave += 1;" },
          },
        ],
      },
    ],
  },
];

export const demoDag = [
  {
    hash: "d12e4419ba72",
    label: "bootstrap",
    x: 48,
    y: 180,
    parents: [] as string[],
  },
  {
    hash: "7c91ae447bc2",
    label: "feature/hard-mode",
    x: 160,
    y: 120,
    parents: ["d12e4419ba72"],
  },
  {
    hash: "b52fd9aa8c3e",
    label: "art/material-pass",
    x: 160,
    y: 220,
    parents: ["7c91ae447bc2"],
  },
  {
    hash: "f34ab29ce810",
    label: "main",
    x: 280,
    y: 160,
    parents: ["7c91ae447bc2", "b52fd9aa8c3e"],
  },
];

export function getRevision(hash: string) {
  return demoRevisions.find((revision) => revision.hash === hash);
}

export function getBranch(name: string) {
  return demoBranches.find((branch) => branch.name === name);
}

export function getLatestRevision() {
  return demoRevisions[0];
}

export function getDemoNode(revisionHash: string, path = "") {
  return snapshots[revisionHash]?.[normalizePath(path)];
}

export function listTreeEntries(revisionHash: string, path = ""): DemoTreeEntry[] {
  const node = getDemoNode(revisionHash, path);

  if (!node || node.kind !== "directory") {
    return [];
  }

  const entries = node.children
    .map((name) => joinPath(path, name))
    .reduce<DemoTreeEntry[]>((accumulator, entryPath) => {
      const entry = getDemoNode(revisionHash, entryPath);

      if (!entry) {
        return accumulator;
      }

      if (entry.kind === "directory") {
        accumulator.push({
          kind: "directory",
          name: basename(entryPath),
          path: entryPath,
        } satisfies DemoTreeEntry);
        return accumulator;
      }

      if (entry.kind === "binary") {
        accumulator.push({
          kind: "binary",
          name: basename(entryPath),
          path: entryPath,
          size: entry.size,
          mimeType: entry.mimeType,
        } satisfies DemoTreeEntry);
        return accumulator;
      }

      accumulator.push({
        kind: "text",
        name: basename(entryPath),
        path: entryPath,
        size: entry.size,
        language: entry.language,
      } satisfies DemoTreeEntry);

      return accumulator;
    }, [])
    .sort((left, right) => {
      if (left.kind === "directory" && right.kind !== "directory") {
        return -1;
      }

      if (left.kind !== "directory" && right.kind === "directory") {
        return 1;
      }

      return left.name.localeCompare(right.name);
    });

  return entries;
}

export function getBreadcrumbs(path = "") {
  const segments = normalizePath(path)
    .split("/")
    .filter(Boolean);

  return segments.map((segment, index) => ({
    label: segment,
    path: segments.slice(0, index + 1).join("/"),
  }));
}

export function getDiff(base: string, head: string) {
  return demoDiffs.find((diff) => diff.base === base && diff.head === head);
}

export function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function getRevisionTreeLink(hash: string, path = "") {
  const normalizedPath = normalizePath(path);
  return normalizedPath ? `tree/${hash}/${normalizedPath}` : `tree/${hash}`;
}

function normalizePath(path: string) {
  return path.replace(/^\/+|\/+$/g, "");
}

function joinPath(basePath: string, child: string) {
  const normalizedBase = normalizePath(basePath);
  return normalizedBase ? `${normalizedBase}/${child}` : child;
}

function basename(path: string) {
  const segments = path.split("/");
  return segments[segments.length - 1] ?? path;
}
