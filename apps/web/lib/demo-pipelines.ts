export type DemoPipelineJobStatus = "passed" | "running" | "pending" | "failed";
export type DemoPipelineRunStatus = "passed" | "running" | "failed";

export type DemoPipelineJob = {
  name: string;
  stage: string;
  status: DemoPipelineJobStatus;
  duration: string;
};

export type DemoPipelineArtifact = {
  name: string;
  path: string;
  size: string;
  partitionLabel: string;
};

export type DemoPipelineRun = {
  id: string;
  title: string;
  branch: string;
  revision: string;
  source: string;
  changeRequestNumber?: number;
  status: DemoPipelineRunStatus;
  triggeredBy: string;
  startedAt: string;
  finishedAt?: string;
  runnerName: string;
  sparsePaths: string[];
  artifactPartition: string;
  jobs: DemoPipelineJob[];
  artifacts: DemoPipelineArtifact[];
  initialLogLines: string[];
};

export const demoPipelineYaml = `version: 1
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
    sparse:
      - Source
      - Config
      - .lorehub
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
      - .lorehub
    steps:
      - ./scripts/build-demo.sh
      - lore artifact upload build/demo-windows.zip

  review-capture:
    stage: review-artifacts
    needs: [build-demo]
    runner: self-hosted-linux
    steps:
      - ./scripts/export-review-capture.sh
      - lore artifact upload review/review-capture.webm
`;

export const demoPipelineRuns: DemoPipelineRun[] = [
  {
    id: "run-107",
    title: "Review artifacts for !7",
    branch: "art/material-pass",
    revision: "f34ab29ce810",
    source: "change_request",
    changeRequestNumber: 7,
    status: "running",
    triggeredBy: "iris",
    startedAt: "2026-06-17T15:40:00Z",
    runnerName: "ce-runner-01",
    sparsePaths: ["Content/Textures", "Content/Audio", "Content/Cinematics", ".lorehub"],
    artifactPartition: "ci/acme-demo/run-107",
    jobs: [
      { name: "validate", stage: "validate", status: "passed", duration: "1m 10s" },
      { name: "build-demo", stage: "build", status: "running", duration: "4m 32s" },
      { name: "review-capture", stage: "review-artifacts", status: "pending", duration: "-" },
    ],
    artifacts: [
      { name: "review-capture.webm", path: "review/review-capture.webm", size: "84 MB", partitionLabel: "ci/acme-demo/run-107" },
      { name: "junit.xml", path: "reports/junit.xml", size: "42 KB", partitionLabel: "ci/acme-demo/run-107" },
    ],
    initialLogLines: [
      "[run-107] runner claimed job on ce-runner-01",
      "[run-107] lore checkout --revision f34ab29ce810 --sparse Content/Textures Content/Audio Content/Cinematics .lorehub",
    ],
  },
  {
    id: "run-106",
    title: "Mainline build after !6",
    branch: "main",
    revision: "f34ab29ce810",
    source: "push",
    status: "passed",
    triggeredBy: "maya",
    startedAt: "2026-06-17T13:20:00Z",
    finishedAt: "2026-06-17T13:32:00Z",
    runnerName: "ce-runner-01",
    sparsePaths: ["Source", "Content/Audio", ".lorehub"],
    artifactPartition: "ci/acme-demo/run-106",
    jobs: [
      { name: "validate", stage: "validate", status: "passed", duration: "58s" },
      { name: "build-demo", stage: "build", status: "passed", duration: "7m 14s" },
      { name: "review-capture", stage: "review-artifacts", status: "passed", duration: "3m 02s" },
    ],
    artifacts: [
      { name: "demo-windows.zip", path: "build/demo-windows.zip", size: "312 MB", partitionLabel: "ci/acme-demo/run-106" },
      { name: "review-capture.webm", path: "review/review-capture.webm", size: "78 MB", partitionLabel: "ci/acme-demo/run-106" },
    ],
    initialLogLines: [
      "[run-106] pipeline completed successfully",
      "[run-106] artifacts committed into Lore partition ci/acme-demo/run-106",
    ],
  },
  {
    id: "run-105",
    title: "Hard-mode pacing verification",
    branch: "feature/hard-mode",
    revision: "7c91ae447bc2",
    source: "change_request",
    changeRequestNumber: 6,
    status: "passed",
    triggeredBy: "rin",
    startedAt: "2026-06-16T15:20:00Z",
    finishedAt: "2026-06-16T15:29:00Z",
    runnerName: "ce-runner-01",
    sparsePaths: ["Source", "Config", ".lorehub"],
    artifactPartition: "ci/acme-demo/run-105",
    jobs: [
      { name: "validate", stage: "validate", status: "passed", duration: "52s" },
      { name: "build-demo", stage: "build", status: "passed", duration: "5m 41s" },
      { name: "review-capture", stage: "review-artifacts", status: "passed", duration: "1m 49s" },
    ],
    artifacts: [
      { name: "metrics.json", path: "reports/metrics.json", size: "9 KB", partitionLabel: "ci/acme-demo/run-105" },
    ],
    initialLogLines: [
      "[run-105] validating hard-mode pacing metrics",
      "[run-105] CR gate marked green",
    ],
  },
];

export function listPipelineRuns() {
  return demoPipelineRuns;
}

export function getPipelineRun(runId: string) {
  return demoPipelineRuns.find((run) => run.id === runId);
}

export function getLatestPipelineForChangeRequest(changeRequestNumber: number) {
  return demoPipelineRuns.find((run) => run.changeRequestNumber === changeRequestNumber);
}

export function getPipelineGate(changeRequestNumber: number, approvals: number) {
  const run = getLatestPipelineForChangeRequest(changeRequestNumber);
  const approvalsRequired = 2;
  const pipelinePassing = run?.status === "passed";
  const canMerge = pipelinePassing && approvals >= approvalsRequired;

  return {
    run,
    approvalsRequired,
    approvals,
    pipelinePassing,
    canMerge,
  };
}
