import Link from "next/link";
import { notFound } from "next/navigation";
import { Fragment } from "react";

import { PipelineLogStream } from "@/components/pipeline-log-stream";
import { RepoTabs } from "@/components/repo-tabs";
import { getPipelineRun } from "@/lib/demo-pipelines";
import { formatDateTime } from "@/lib/format";

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
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="pipelines" />
      </section>

      <header>
        <div className="meta-row" style={{ marginBottom: "0.4rem" }}>
          <Link className="muted" href={`/${org}/${repo}/pipelines`}>← All runs</Link>
        </div>
        <div className="repo-title">
          <div>
            <h1 style={{ marginBottom: "0.4rem" }}>{run.title} <span className="muted" style={{ fontWeight: 400 }}>{run.id}</span></h1>
            <div className="meta-row muted">
              <span className={`pill ${run.status === "passed" ? "success-pill" : run.status === "failed" ? "warn-pill" : ""}`}>{run.status}</span>
              <span><code>{run.branch}</code> @ <code>{run.revision.slice(0, 7)}</code></span>
              <span>· started {formatDateTime(run.startedAt)}</span>
            </div>
          </div>
          {run.changeRequestNumber ? (
            <Link className="button-secondary" href={`/${org}/${repo}/cr/${run.changeRequestNumber}`}>
              Linked CR !{run.changeRequestNumber}
            </Link>
          ) : null}
        </div>
      </header>

      <div className="detail-grid">
        <div style={{ display: "grid", gap: "1rem" }}>
          <article className="panel">
            <h3>Jobs</h3>
            <div className="pipeline-jobs top-gap-sm">
              {run.jobs.map((job) => (
                <div key={job.name} className="merge-status" style={{ border: "1px solid var(--border-muted)", borderRadius: "var(--radius)", marginBottom: "0.5rem" }}>
                  <span className={`merge-dot ${job.status === "passed" ? "ok" : job.status === "failed" ? "fail" : job.status === "running" ? "warn" : "muted"}`} />
                  <div style={{ flex: 1 }}>
                    <strong>{job.name}</strong>
                    <div className="muted" style={{ fontSize: "0.82rem" }}>{job.stage} · {job.duration}</div>
                  </div>
                  <span className={`job-pill ${job.status}`}>{job.status}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <h3>Live log stream</h3>
            <PipelineLogStream runId={run.id} initialLines={run.initialLogLines} />
          </article>

          <article className="panel">
            <h3>Artifacts stored in Lore</h3>
            <div className="table-grid artifact-table top-gap-sm">
              <div className="table-header">Artifact</div>
              <div className="table-header">Path</div>
              <div className="table-header">Size</div>
              <div className="table-header">Partition</div>
              {run.artifacts.map((artifact) => (
                <Fragment key={artifact.name}>
                  <div className="table-cell strong-cell">{artifact.name}</div>
                  <div className="table-cell"><code style={{ fontSize: "0.8rem" }}>{artifact.path}</code></div>
                  <div className="table-cell">{artifact.size}</div>
                  <div className="table-cell"><code style={{ fontSize: "0.8rem" }}>{artifact.partitionLabel}</code></div>
                </Fragment>
              ))}
            </div>
          </article>
        </div>

        <aside>
          <div className="sidebar-block">
            <h4>Runner</h4>
            <span>{run.runnerName}</span>
          </div>
          <div className="sidebar-block">
            <h4>Triggered by</h4>
            <span>{run.triggeredBy} · {run.source.replace("_", " ")}</span>
          </div>
          <div className="sidebar-block">
            <h4>Sparse checkout</h4>
            <div className="stack-links">
              {run.sparsePaths.map((path) => (
                <code key={path} style={{ fontSize: "0.8rem" }}>{path}</code>
              ))}
            </div>
          </div>
          <div className="sidebar-block">
            <h4>Artifact partition</h4>
            <code style={{ fontSize: "0.8rem" }}>{run.artifactPartition}</code>
          </div>
        </aside>
      </div>
    </main>
  );
}
