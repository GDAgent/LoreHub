import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SHOOT_BASE ?? "http://127.0.0.1:3000";
const OUT = "/tmp/lh-shots";
mkdirSync(OUT, { recursive: true });

const pages = [
  ["home", "/"],
  ["dashboard", "/dashboard"],
  ["explore", "/explore"],
  ["repo-home", "/acme/demo"],
  ["issues", "/acme/demo/issues"],
  ["issue-detail", "/acme/demo/issues/1"],
  ["cr", "/acme/demo/cr"],
  ["cr-detail", "/acme/demo/cr/1"],
  ["pipelines", "/acme/demo/pipelines"],
  ["assets", "/acme/demo/assets"],
  ["analytics", "/acme/demo/analytics"],
  ["tree", "/acme/demo/tree/f34ab29ce810"],
  ["login", "/login"],
  ["admin", "/admin"],
];

const browser = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme,
  });
  // set persisted theme so the app's toggle state matches
  await ctx.addInitScript((t) => {
    try { localStorage.setItem("lorehub-theme", t); } catch {}
  }, theme);
  const page = await ctx.newPage();
  for (const [name, path] of pages) {
    try {
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${name}-${theme}.png`, fullPage: true });
      console.log(`ok  ${name}-${theme}`);
    } catch (e) {
      console.log(`ERR ${name}-${theme}: ${e.message}`);
    }
  }
  await ctx.close();
}
// one mobile shot
const m = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light" });
const mp = await m.newPage();
for (const [name, path] of [["repo-home", "/acme/demo"], ["issues", "/acme/demo/issues"]]) {
  await mp.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 20000 });
  await mp.waitForTimeout(900);
  await mp.screenshot({ path: `${OUT}/${name}-mobile.png`, fullPage: true });
  console.log(`ok  ${name}-mobile`);
}
await browser.close();
console.log("done ->", OUT);
