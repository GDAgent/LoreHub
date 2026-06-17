import Link from "next/link";
import { notFound } from "next/navigation";

import { getDiff, getRevision } from "@/lib/demo-repository";

type DiffPageProps = {
  params: Promise<{
    org: string;
    repo: string;
    base: string;
    head: string;
  }>;
};

export default async function DiffPage({ params }: DiffPageProps) {
  const { org, repo, base, head } = await params;
  const diff = getDiff(base, head);
  const baseRevision = getRevision(base);
  const headRevision = getRevision(head);

  if (!diff) {
    notFound();
  }

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>Diff viewer</h1>
          </div>
          <span className="pill">
            {baseRevision?.shortHash ?? base.slice(0, 7)}..{headRevision?.shortHash ?? head.slice(0, 7)}
          </span>
        </div>
        <p className="muted">
          Review the same patch in unified and side-by-side form. This keeps the browsing shell close to the intended code review workflow.
        </p>
      </section>

      {diff.files.map((file) => (
        <section key={file.path} className="panel diff-panel">
          <div className="section-header">
            <div>
              <h2>{file.path}</h2>
              <p className="muted">{file.summary}</p>
            </div>
            <Link className="button-secondary" href={`/${org}/${repo}/tree/${head}/${file.path}`}>
              Open file snapshot
            </Link>
          </div>

          <div className="diff-layout">
            <div>
              <h3>Unified</h3>
              <div className="code-block diff-block">
                {file.unified.map((line, index) => (
                  <div key={`${file.path}-u-${index}`} className={`diff-line ${line.kind}`}>
                    <span className="line-pair">
                      <span>{line.oldNumber ?? ""}</span>
                      <span>{line.newNumber ?? ""}</span>
                    </span>
                    <code>{line.text}</code>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Side-by-side</h3>
              <div className="split-diff">
                {file.split.map((line, index) => (
                  <div key={`${file.path}-s-${index}`} className="split-row">
                    <div className={`split-cell ${line.left?.kind ?? "empty"}`}>
                      <span className="line-number">{line.left?.number ?? ""}</span>
                      <code>{line.left?.text ?? ""}</code>
                    </div>
                    <div className={`split-cell ${line.right?.kind ?? "empty"}`}>
                      <span className="line-number">{line.right?.number ?? ""}</span>
                      <code>{line.right?.text ?? ""}</code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
