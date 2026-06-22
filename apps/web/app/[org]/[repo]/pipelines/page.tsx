import Link from "next/link";

import { RepoTabs } from "@/components/repo-tabs";
import { demoPipelineYaml, listPipelineRuns } from "@/lib/demo-pipelines";
import { formatDate } from "@/lib/format";

type PipelinesPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

function runState(status: string) {
  if (status === "passed") return { cls: "state-open", glyph: "✓" };
  if (status === "failed") return { cls: "state-closed", glyph: "✕" };
  return { cls: "state-draft", glyph: "●" };
}

export default async function PipelinesPage({ params }: PipelinesPageProps) {
  const { org, repo } = await params;
  const runs = listPipelineRuns();

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="pipelines" />
      </section>

      <div className="section-header">
        <div>
          <h1>Pipelines</h1>
          <p className="muted" style={{ margin: 0 }}>CI runs triggered on push, change request, and tag — defined in <code>.lorehub/pipeline.yml</code>.</p>
        </div>
        <Link className="button-secondary" href={`/${org}/${repo}/tree/f34ab29ce810/.lorehub/pipeline.yml`}>
          View pipeline.yml
        </Link>
      </div>

      <div className="list-rows">
        {runs.map((run) => {
          const meta = runState(run.status);
          return (
            <div key={run.id} className="list-row">
              <span className={`list-row-icon ${meta.cls}`} style={{ fontSize: "1rem", fontWeight: 700 }}>{meta.glyph}</span>
              <div className="list-row-main">
                <div className="list-row-title">
                  <Link href={`/${org}/${repo}/pipelines/${run.id}`}>{run.title}</Link>
                  <span className={`pill ${run.status === "passed" ? "success-pill" : run.status === "failed" ? "warn-pill" : ""}`} style={{ marginLeft: "0.5rem" }}>
                    {run.status}
                  </span>
                </div>
                <div className="list-row-meta">
                  <span>{run.id}</span>
                  <span>· {run.branch}</span>
                  <span>· {run.source.replace("_", " ")}</span>
                  <span>· {run.runnerName}</span>
                  <span>· started {formatDate(run.startedAt)}</span>
                </div>
                <div className="pipeline-job-strip" style={{ marginTop: "0.5rem" }}>
                  {run.jobs.map((job) => (
                    <span key={`${run.id}-${job.name}`} className={`job-pill ${job.status}`}>{job.name}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <article className="panel">
        <div className="section-header">
          <h2>Pipeline as code</h2>
          <span className="pill muted-pill">.lorehub/pipeline.yml</span>
        </div>
        <p className="muted" style={{ marginTop: 0 }}>
          Sparse checkout and artifact upload are baked into the DSL — runners fetch only the paths each job needs.
        </p>
        <pre className="terminal-block top-gap-sm"><code>{demoPipelineYaml}</code></pre>
      </article>
    </main>
  );
}
