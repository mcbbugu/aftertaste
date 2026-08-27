import pc from "picocolors";
import type { AuditResult, FindingCategory } from "./types.js";

const CAT: Record<FindingCategory, string> = {
  fonts: "fonts  ",
  palette: "palette",
  layout: "layout ",
  copy: "copy   ",
  motion: "motion ",
};

function bar(score: number): string {
  const n = Math.round(score / 10);
  return `${"▓".repeat(n)}${"░".repeat(10 - n)}`;
}

function scoreColor(score: number): (s: string) => string {
  if (score <= 20) return pc.red;
  if (score <= 40) return pc.magenta;
  if (score <= 60) return pc.yellow;
  if (score <= 80) return pc.cyan;
  return pc.green;
}

export function renderReport(result: AuditResult): string {
  const c = scoreColor(result.score);
  const lines: string[] = [];
  lines.push("");
  lines.push(`  ${pc.bold("aftertaste")}  ${pc.dim("·")}  ${pc.underline(result.url)}`);
  lines.push("");
  lines.push(`  ${c(pc.bold(String(result.score).padStart(3)))}  ${c(bar(result.score))}  ${c(result.label)}`);
  lines.push(`  ${pc.dim("─".repeat(52))}`);
  lines.push("");
  for (const part of wrap(result.summary, 52)) {
    lines.push(`  ${part}`);
  }
  lines.push("");
  if (result.findings.length === 0) {
    lines.push(`  ${pc.green("no slop tells")}`);
  }
  for (const f of result.findings) {
    lines.push(`  ${pc.bold(CAT[f.category])}  ${f.title}  ${pc.dim("−" + f.deduction)}`);
    for (const ev of f.evidence.slice(0, 4)) {
      lines.push(`           ${pc.dim(clip(ev, 56))}`);
    }
    lines.push("");
  }
  if (result.screenshotPath) {
    lines.push(`  ${pc.dim("screenshot")}  ${result.screenshotPath}`);
    lines.push("");
  }
  return lines.join("\n");
}

function clip(s: string, n: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n - 1) + "…";
}

function wrap(s: string, width: number): string[] {
  const words = s.split(/\s+/);
  const rows: string[] = [];
  let row = "";
  for (const w of words) {
    const next = row ? `${row} ${w}` : w;
    if (next.length > width) {
      if (row) rows.push(row);
      row = w;
    } else {
      row = next;
    }
  }
  if (row) rows.push(row);
  return rows;
}
