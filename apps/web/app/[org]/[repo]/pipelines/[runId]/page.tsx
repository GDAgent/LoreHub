import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { PipelineLogStream } from "@/components/pipeline-log-stream";
import { getPipelineRun } from "@/lib/demo-pipelines";

type PipelineRunPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    runId: string;
  }>;
};

export default async function PipelineRunPage({ params }: PipelineRunPageProps) {
  const { org, repo, runId } = await params;
  const run = getPipelineRun(runId);

  if (!run) {
    notFound();
  }

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>{run.id} {run.title}</h1>
          </div>
          <span className={`pill ${run.status === "passed" ? "success-pill" : run.status === "running" ? "accent-pill" : "warn-pill"}`}>
            {run.status}
          </span>
        </div>
        <div className="meta-row muted">
          <span>{run.branch}</span>
          <span>{run.revision}</span>
          <span>{run.runnerName}</span>
        </div>
        <div className="cta-row compact">
          <Link className="button-secondary" href={`/${org}/${repo}/pipelines`}>
            All pipeline runs
          </Link>
          <Link className="button-secondary" href={`/${org}/${repo}/cr/${run.changeRequestNumber ?? 7}`}>
            Linked change request
          </Link>
        </div>
      </section>

      <section className="grid two top-gap">
        <article className="panel">
          <h2>Runner</h2>
          <ul className="list">
            <li>Runner: {run.runnerName}</li>
            <li>Sparse checkout: {run.sparsePaths.join(", ")}</li>
            <li>Artifact partition: {run.artifactPartition}</li>
            <li>Triggered by: {run.triggeredBy}</li>
          </ul>
          <div className="top-gap">
            <h2>Jobs</h2>
            <div className="pipeline-jobs top-gap-sm">
              {run.jobs.map((job) => (
                <article key={job.name} className="comment-card">
                  <div className="section-header">
                    <strong>{job.name}</strong>
                    <span className={`pill ${job.status === "passed" ? "success-pill" : job.status === "running" ? "accent-pill" : job.status === "failed" ? "warn-pill" : "muted-pill"}`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="meta-row muted">
                    <span>{job.stage}</span>
                    <span>{job.duration}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </article>

        <article className="panel">
          <h2>Live log stream</h2>
          <PipelineLogStream runId={run.id} initialLines={run.initialLogLines} />
        </article>
      </section>

      <section className="panel top-gap">
        <h2>Artifacts stored in Lore</h2>
        <div className="table-grid artifact-table top-gap-sm">
          <div className="table-header">Artifact</div>
          <div className="table-header">Path</div>
          <div className="table-header">Size</div>
          <div className="table-header">Partition</div>
          {run.artifacts.map((artifact) => (
            <Fragment key={artifact.name}>
              <div className="table-cell strong-cell">{artifact.name}</div>
              <div className="table-cell">{artifact.path}</div>
              <div className="table-cell">{artifact.size}</div>
              <div className="table-cell">{artifact.partitionLabel}</div>
            </Fragment>
          ))}
        </div>
      </section>
    </main>
  );
}
