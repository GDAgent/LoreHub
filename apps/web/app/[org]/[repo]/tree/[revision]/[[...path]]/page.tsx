import Link from "next/link";
import { notFound } from "next/navigation";

import {
  formatBytes,
  getBreadcrumbs,
  getDemoNode,
  getLatestRevision,
  getRevisionTreeLink,
  listTreeEntries,
} from "@/lib/demo-repository";
import { highlightCode } from "@/lib/highlight";

type TreePageProps = {
  params: Promise<{
    org: string;
    repo: string;
    revision: string;
    path?: string[];
  }>;
};

export default async function TreePage({ params }: TreePageProps) {
  const { org, repo, revision, path } = await params;
  const activeRevision = revision === "latest" ? getLatestRevision()?.hash ?? revision : revision;
  const currentPath = path?.join("/") ?? "";
  const node = getDemoNode(activeRevision, currentPath);

  if (!node) {
    notFound();
  }

  const breadcrumbs = getBreadcrumbs(currentPath);
  const entries = node.kind === "directory" ? listTreeEntries(activeRevision, currentPath) : [];
  const highlightedCode = node.kind === "text" ? await highlightCode(node.content, node.language) : null;

  return (
    <main className="shell page">
      <section className="panel">
        <div className="section-header">
          <div>
            <div className="repo-path">{org} / {repo}</div>
            <h1>Repository browser</h1>
          </div>
          <span className="pill">Revision {activeRevision.slice(0, 7)}</span>
        </div>
        <div className="breadcrumbs">
          <Link href={`/${org}/${repo}/tree/${activeRevision}`}>root</Link>
          {breadcrumbs.map((crumb) => (
            <Link
              key={crumb.path}
              href={`/${org}/${repo}/${getRevisionTreeLink(activeRevision, crumb.path)}`}
            >
              {crumb.label}
            </Link>
          ))}
        </div>
      </section>

      {node.kind === "directory" ? (
        <section className="panel">
          <h2>Tree</h2>
          <div className="entry-table">
            {entries.map((entry) => {
              const href = `/${org}/${repo}/${getRevisionTreeLink(activeRevision, entry.path)}`;

              return (
                <Link key={entry.path} className="entry-row" href={href}>
                  <span className="entry-name">{entry.name}</span>
                  <span className="entry-kind">{entry.kind}</span>
                  <span className="entry-meta">
                    {entry.size ? formatBytes(entry.size) : entry.language ?? entry.mimeType ?? "folder"}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : node.kind === "text" ? (
        <section className="panel">
          <div className="code-header">
            <div>
              <h2>{breadcrumbs[breadcrumbs.length - 1]?.label ?? repo}</h2>
              <p className="muted">
                {node.language.toUpperCase()} file at revision {activeRevision.slice(0, 7)}.
              </p>
            </div>
            <span className="pill">{formatBytes(node.size)}</span>
          </div>
          <div className="code-highlight" dangerouslySetInnerHTML={{ __html: highlightedCode ?? "" }} />
        </section>
      ) : (
        <section className="panel binary-card">
          <h2>{breadcrumbs[breadcrumbs.length - 1]?.label ?? repo}</h2>
          <p className="muted">{node.description}</p>
          <div className="meta-row">
            <span className="pill">Binary asset</span>
            <span className="pill">{node.mimeType}</span>
            <span className="pill">{formatBytes(node.size)}</span>
          </div>
          <p className="muted">
            Phase 1 flags binary content cleanly and reserves preview space for the richer image,
            audio, video, and 3D viewers planned later.
          </p>
        </section>
      )}
    </main>
  );
}
