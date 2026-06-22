"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { CommandPalette } from "@/components/command-palette";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/explore", label: "Explore" },
  { href: "/acme/demo", label: "Repositories" },
  { href: "/acme/demo/pipelines", label: "Pipelines" },
  { href: "/admin", label: "Admin" },
];

type Theme = "light" | "dark";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");
  const [userOpen, setUserOpen] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const current = (document.documentElement.getAttribute("data-theme") as Theme) || "light";
    setTheme(current);
  }, []);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("lorehub-theme", next);
    } catch {
      /* ignore */
    }
  }

  function openPalette() {
    window.dispatchEvent(new Event("lorehub:open-palette"));
  }

  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>LoreHub</span>
        </Link>

        <button className="header-search header-search-input" type="button" onClick={openPalette} aria-label="Search (Cmd K)">
          <SearchIcon />
          <span>Search or jump to…</span>
          <span className="kbd">⌘K</span>
        </button>

        <nav className={`nav-links site-nav-shell ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <button className="icon-button" type="button" onClick={openPalette} aria-label="Search" title="Search (⌘K)">
            <SearchIcon />
          </button>
          <button className="icon-button" type="button" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
          <Link className="icon-button" href="/acme/notifications" aria-label="Notifications" title="Notifications">
            <BellIcon />
          </Link>
          <div className="user-menu" ref={userRef}>
            <button className="avatar-button" type="button" onClick={() => setUserOpen((v) => !v)} aria-label="Account menu" aria-expanded={userOpen}>
              R
            </button>
            {userOpen ? (
              <div className="dropdown" role="menu">
                <div className="dropdown-head">
                  <strong>Rin Tanaka</strong>
                  <span className="muted">@rin</span>
                </div>
                <Link className="dropdown-item" href="/dashboard" role="menuitem">Dashboard</Link>
                <Link className="dropdown-item" href="/acme/demo" role="menuitem">Your repositories</Link>
                <Link className="dropdown-item" href="/acme/notifications" role="menuitem">Notifications</Link>
                <Link className="dropdown-item" href="/acme/settings" role="menuitem">Settings</Link>
                <div className="dropdown-sep" />
                <Link className="dropdown-item" href="/login" role="menuitem">Sign out</Link>
              </div>
            ) : null}
          </div>
          <button
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            className="mobile-nav-toggle"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      <CommandPalette />
    </header>
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

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
