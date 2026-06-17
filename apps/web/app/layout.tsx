import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "LoreHub",
  description: "Phase 0 scaffold for the Lore-native collaboration platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="shell site-header-inner">
            <Link className="brand" href="/">
              <span className="brand-mark">L</span>
              <span>LoreHub</span>
            </Link>
            <nav className="nav-links">
              <Link href="/explore">Explore</Link>
              <Link href="/acme/demo">Repository</Link>
              <Link href="/login">Log in</Link>
              <Link href="/register">Register</Link>
              <Link href="/admin">Admin</Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
