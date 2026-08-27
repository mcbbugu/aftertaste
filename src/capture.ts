import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import type { PageSnapshot } from "./types.js";

function safeName(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "file:") {
      const base = path.basename(u.pathname) || "local";
      return base.replace(/\.[^.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-");
    }
    return (u.hostname || "page").replace(/[^a-z0-9._-]+/gi, "-");
  } catch {
    return "page";
  }
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export async function capturePage(
  url: string,
  outDir: string,
): Promise<{ snapshot: PageSnapshot; screenshotPath: string }> {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const waitUntil = url.startsWith("file:") ? "load" : "domcontentloaded";
    await page.goto(url, { waitUntil, timeout: 45_000 });
    await new Promise((r) => setTimeout(r, 400));

    const scriptPath = fileURLToPath(new URL("./collect.browser.js", import.meta.url));
    await page.addScriptTag({ path: scriptPath });
    const snapshot = (await page.evaluate("collect(" + JSON.stringify(url) + ")")) as PageSnapshot;

    await mkdir(outDir, { recursive: true });
    const screenshotPath = path.join(outDir, `${safeName(url)}-${stamp()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    snapshot.url = url;
    return { snapshot, screenshotPath };
  } finally {
    await browser.close();
  }
}

