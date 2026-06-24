import Link from "next/link";
import { notFound } from "next/navigation";

import { RepoTabs } from "@/components/repo-tabs";
import { formatBytes } from "@/lib/format";
import { getBlob, getRevisions, getTree } from "@/lib/repo-data";

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

function breadcrumbsFor(path: string) {
  const segments = path.split("/").filter(Boolean);
  return segments.map((label, index) => ({
    label,
    path: segments.slice(0, index + 1).join("/"),
  }));
}

export default async function TreePage({ params }: TreePageProps) {
  const { org, repo, revision, path } = await params;

  let activeRevision = revision;
  if (revision === "latest") {
    const revisions = await getRevisions(org, repo);
    activeRevision = revisions[0]?.hash ?? revision;
  }

  const currentPath = path?.join("/") ?? "";
  const entries = await getTree(org, repo, activeRevision, currentPath);
  const blob = entries.length === 0 && currentPath ? await getBlob(org, repo, activeRevision, currentPath) : null;
  const isDirectory = currentPath === "" || entries.length > 0;

  if (!isDirectory && !blob) {
    notFound();
  }

  const breadcrumbs = breadcrumbsFor(currentPath);
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
            <Link key={crumb.path} href={`/${org}/${repo}/tree/${activeRevision}/${crumb.path}`}>
              {crumb.label}
            </Link>
          ))}
        </div>
        <span className="pill muted-pill">revision <code style={{ fontSize: "0.85em" }}>{activeRevision.slice(0, 7)}</code></span>
      </div>

      {isDirectory ? (
        entries.length > 0 ? (
          <section className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <table className="table">
              <tbody>
                {entries.map((entry) => {
                  const isDir = entry.kind === "directory";
                  return (
                    <tr key={entry.path}>
                      <td style={{ width: "1.5rem" }}>{isDir ? <FolderIcon /> : <FileIcon />}</td>
                      <td><Link href={`/${org}/${repo}/tree/${activeRevision}/${entry.path}`}>{entry.name}</Link></td>
                      <td className="muted" style={{ textAlign: "right" }}>
                        {entry.size ? formatBytes(entry.size) : isDir ? "—" : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ) : (
          <section className="panel empty-state">
            <p className="muted" style={{ margin: 0 }}>
              This revision has no content. Push files with the Lore client to populate the tree.
            </p>
          </section>
        )
      ) : (
        <section className="panel">
          <div className="section-header">
            <h2 style={{ marginTop: 0 }}>{fileName}</h2>
            <span className="pill">{blob?.isBinary ? "Binary asset" : "File"}</span>
          </div>
          <div className="metadata-list" style={{ maxWidth: "420px" }}>
            <div className="metadata-row"><span className="muted">Type</span><strong>{blob?.mimeType}</strong></div>
            <div className="metadata-row"><span className="muted">Size</span><strong>{blob ? formatBytes(blob.size) : "—"}</strong></div>
          </div>
          <p className="muted" style={{ fontSize: "0.88rem" }}>
            File content preview isn&apos;t served over the read API yet — only Lore
            metadata (type, size) is available here.
          </p>
        </section>
      )}
    </main>
  );
}
