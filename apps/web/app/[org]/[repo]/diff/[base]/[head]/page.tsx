import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
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

  const totals = diff.files.reduce(
    (acc, file) => {
      acc.add += file.unified.filter((line) => line.kind === "add").length;
      acc.remove += file.unified.filter((line) => line.kind === "remove").length;
      return acc;
    },
    { add: 0, remove: 0 },
  );

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="code" />
      </section>

      <header>
        <h1 style={{ marginBottom: "0.5rem" }}>Comparing changes</h1>
        <div className="meta-row muted">
          <span className="pill" style={{ fontFamily: "var(--font-mono)" }}>
            {baseRevision?.shortHash ?? base.slice(0, 7)} … {headRevision?.shortHash ?? head.slice(0, 7)}
          </span>
          <span>{diff.files.length} file{diff.files.length === 1 ? "" : "s"} changed</span>
          <span style={{ color: "var(--success)" }}>+{totals.add}</span>
          <span style={{ color: "var(--danger)" }}>−{totals.remove}</span>
        </div>
      </header>

      {diff.files.map((file) => {
        const adds = file.unified.filter((line) => line.kind === "add").length;
        const removes = file.unified.filter((line) => line.kind === "remove").length;
        return (
          <section key={file.path} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="meta-row" style={{ justifyContent: "space-between", padding: "0.65rem 1rem", background: "var(--canvas-inset)", borderBottom: "1px solid var(--border-muted)" }}>
              <span className="meta-row">
                <code style={{ fontWeight: 600 }}>{file.path}</code>
                <span style={{ color: "var(--success)", fontSize: "0.82rem" }}>+{adds}</span>
                <span style={{ color: "var(--danger)", fontSize: "0.82rem" }}>−{removes}</span>
              </span>
              <Link className="muted" href={`/${org}/${repo}/tree/${head}/${file.path}`} style={{ fontSize: "0.85rem" }}>
                View file →
              </Link>
            </div>
            {file.summary ? <p className="muted" style={{ padding: "0.5rem 1rem", margin: 0, fontSize: "0.88rem", borderBottom: "1px solid var(--border-muted)" }}>{file.summary}</p> : null}

            <div className="code-block diff-block" style={{ border: "none", borderRadius: 0, marginTop: 0 }}>
              {file.unified.map((line, index) => (
                <div key={`${file.path}-u-${index}`} className={`diff-line ${line.kind}`}>
                  <span className="line-pair">
                    <span>{line.oldNumber ?? ""}</span>
                    <span>{line.newNumber ?? ""}</span>
                  </span>
                  <code>{(line.kind === "add" ? "+ " : line.kind === "remove" ? "- " : "  ") + line.text}</code>
                </div>
              ))}
            </div>

            <details style={{ borderTop: "1px solid var(--border-muted)" }}>
              <summary style={{ padding: "0.6rem 1rem", cursor: "pointer", color: "var(--muted)", fontSize: "0.88rem", fontWeight: 600 }}>
                Side-by-side view
              </summary>
              <div className="split-diff" style={{ border: "none", borderRadius: 0 }}>
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
            </details>
          </section>
        );
      })}
    </main>
  );
}
