import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
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

function FolderIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ color: "var(--brand)" }}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ color: "var(--muted)" }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

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
  const fileName = breadcrumbs[breadcrumbs.length - 1]?.label ?? repo;

  return (
    <main className="shell page">
      <section>
        <div className="repo-path">
          <Link href={`/${org}`}>{org}</Link> / <Link href={`/${org}/${repo}`}><strong>{repo}</strong></Link>
        </div>
        <RepoTabs org={org} repo={repo} active="code" />
      </section>

      <div className="meta-row" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
        <div className="breadcrumbs">
          <Link href={`/${org}/${repo}/tree/${activeRevision}`}>{repo}</Link>
          {breadcrumbs.map((crumb) => (
            <Link key={crumb.path} href={`/${org}/${repo}/${getRevisionTreeLink(activeRevision, crumb.path)}`}>
              {crumb.label}
            </Link>
          ))}
        </div>
        <span className="pill muted-pill">revision <code style={{ fontSize: "0.85em" }}>{activeRevision.slice(0, 7)}</code></span>
      </div>

      {node.kind === "directory" ? (
        <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <tbody>
              {entries.map((entry) => {
                const href = `/${org}/${repo}/${getRevisionTreeLink(activeRevision, entry.path)}`;
                const isDir = entry.kind === "directory";
                return (
                  <tr key={entry.path}>
                    <td style={{ width: "1.5rem" }}>{isDir ? <FolderIcon /> : <FileIcon />}</td>
                    <td><Link href={href}>{entry.name}</Link></td>
                    <td className="muted" style={{ textAlign: "right" }}>
                      {entry.size ? formatBytes(entry.size) : entry.language ?? entry.mimeType ?? (isDir ? "—" : "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ) : node.kind === "text" ? (
        <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div className="code-header" style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <div className="meta-row">
              <strong>{fileName}</strong>
              <span className="pill muted-pill">{node.language.toUpperCase()}</span>
              <span className="muted" style={{ fontSize: "0.85rem" }}>{formatBytes(node.size)}</span>
            </div>
            <div className="meta-row">
              <button className="button-secondary" type="button">Copy</button>
              <button className="button-secondary" type="button">Raw</button>
            </div>
          </div>
          <div className="code-highlight" dangerouslySetInnerHTML={{ __html: highlightedCode ?? "" }} />
        </section>
      ) : (
        <section className="panel">
          <div className="section-header">
            <h2 style={{ marginTop: 0 }}>{fileName}</h2>
            <span className="pill">Binary asset</span>
          </div>
          <p className="muted">{node.description}</p>
          <div className="metadata-list" style={{ maxWidth: "420px" }}>
            <div className="metadata-row"><span className="muted">Type</span><strong>{node.mimeType}</strong></div>
            <div className="metadata-row"><span className="muted">Size</span><strong>{formatBytes(node.size)}</strong></div>
          </div>
          <p className="muted" style={{ fontSize: "0.88rem" }}>
            Browse rich previews and dedup metadata for textures, audio, models, and video in the{" "}
            <Link className="inline-link" href={`/${org}/${repo}/assets`}>asset browser</Link>.
          </p>
        </section>
      )}
    </main>
  );
}
