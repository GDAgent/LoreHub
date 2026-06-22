import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SiteHeader } from "@/components/site-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LoreHub — collaboration for Lore repositories",
    template: "%s · LoreHub",
  },
  description:
    "LoreHub is the self-hostable collaboration platform for Lore, Epic's binary-first version control system. Repositories, change requests, CI/CD, and game-asset tooling in one place.",
};

const themeInit = `(function(){try{var t=localStorage.getItem('lorehub-theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
