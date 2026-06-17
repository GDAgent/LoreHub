import Link from "next/link";

import { demoPipelineYaml, listPipelineRuns } from "@/lib/demo-pipelines";

type PipelinesPageProps = {
  params: Promise<{
    org: string;
    repo: string;
  }>;
};

export default async function PipelinesPage({ params }: PipelinesPageProps) {
  const { org, repo } = await params;
  const runs = listPipelineRuns();

  return (
    <main className="shell page">
      <section className="grid two">
        <article className="panel">
          <div className="section-header">
            <div>
              <div className="repo-path">{org} / {repo}</div>
              <h1>Pipelines</h1>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/tree/f34ab29ce810/.lorehub/pipeline.yml`}>
              Open pipeline.yml
            </Link>
          </div>
          <div className="revision-list top-gap-sm">
            {runs.map((run) => (
              <article key={run.id} className="revision-card">
                <div className="section-header">
                  <div>
                    <div className="meta-row">
                      <span className="pill">{run.id}</span>
                      <span className={`pill ${run.status === "passed" ? "success-pill" : run.status === "running" ? "accent-pill" : "warn-pill"}`}>
                        {run.status}
                      </span>
                    </div>
                    <h2>{run.title}</h2>
                  </div>
                  <Link className="button-secondary" href={`/${org}/${repo}/pipelines/${run.id}`}>
                    Open run
                  </Link>
                </div>
                <div className="meta-row muted">
                  <span>{run.branch}</span>
                  <span>{run.source}</span>
                  <span>{run.runnerName}</span>
                </div>
                <div className="pipeline-job-strip top-gap-sm">
                  {run.jobs.map((job) => (
                    <span key={`${run.id}-${job.name}`} className={`job-pill ${job.status}`}>
                      {job.name}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="panel">
          <h2>Pipeline as code</h2>
          <p className="muted">
            Phase 4 keeps CI defined in `.lorehub/pipeline.yml`, with sparse checkout and artifact upload baked into the DSL.
          </p>
          <pre className="terminal-block top-gap-sm"><code>{demoPipelineYaml}</code></pre>
        </article>
      </section>
    </main>
  );
}
