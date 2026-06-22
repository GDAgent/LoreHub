"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Command = {
  label: string;
  hint: string;
  href: string;
  group: string;
};

const COMMANDS: Command[] = [
  { label: "Dashboard", hint: "Your activity and repositories", href: "/dashboard", group: "Navigate" },
  { label: "Explore repositories", hint: "Discover public projects", href: "/explore", group: "Navigate" },
  { label: "Admin area", hint: "Server administration", href: "/admin", group: "Navigate" },
  { label: "Enterprise: Authentication", hint: "SSO / SAML / OIDC", href: "/admin/enterprise/auth", group: "Navigate" },
  { label: "acme / demo — Code", hint: "Browse repository files", href: "/acme/demo", group: "Repository" },
  { label: "acme / demo — Issues", hint: "Track work", href: "/acme/demo/issues", group: "Repository" },
  { label: "acme / demo — Change requests", hint: "Review and merge", href: "/acme/demo/cr", group: "Repository" },
  { label: "acme / demo — Pipelines", hint: "CI/CD runs", href: "/acme/demo/pipelines", group: "Repository" },
  { label: "acme / demo — Assets", hint: "Game asset browser", href: "/acme/demo/assets", group: "Repository" },
  { label: "acme / demo — Analytics", hint: "Storage & dedup", href: "/acme/demo/analytics", group: "Repository" },
  { label: "Sign in", hint: "Access your account", href: "/login", group: "Account" },
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("lorehub:open-palette", () => setOpen(true));
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter(
      (command) =>
        command.label.toLowerCase().includes(q) || command.hint.toLowerCase().includes(q),
    );
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="palette-overlay" onMouseDown={() => setOpen(false)} role="presentation">
      <div
        className="palette"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="palette-search">
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(value + 1, results.length - 1));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              } else if (event.key === "Enter" && results[active]) {
                go(results[active].href);
              }
            }}
            placeholder="Search repositories, issues, actions…"
            aria-label="Search"
          />
          <span className="kbd">Esc</span>
        </div>
        <div className="palette-results">
          {results.length === 0 ? (
            <p className="palette-empty">No matches for “{query}”.</p>
          ) : (
            results.map((command, index) => (
              <button
                key={command.href + command.label}
                type="button"
                className={`palette-item ${index === active ? "active" : ""}`}
                onMouseEnter={() => setActive(index)}
                onClick={() => go(command.href)}
              >
                <span className="palette-item-label">{command.label}</span>
                <span className="palette-item-hint">{command.hint}</span>
                <span className="palette-item-group">{command.group}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
