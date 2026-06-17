"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { href: "/explore", label: "Explore" },
  { href: "/acme/demo", label: "Repository" },
  { href: "/login", label: "Log in" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/enterprise/auth", label: "Enterprise" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell site-header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">L</span>
          <span>LoreHub</span>
        </Link>
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
        <nav className={`nav-links site-nav-shell ${menuOpen ? "open" : ""}`}>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
