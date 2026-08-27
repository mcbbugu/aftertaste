import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditResult, PageSnapshot } from "./types.js";

export async function writeSkill(result: AuditResult, snapshot: PageSnapshot, cwd = process.cwd()): Promise<string> {
  const dir = path.join(cwd, ".cursor", "skills", "aftertaste");
  await mkdir(dir, { recursive: true });
  const dest = path.join(dir, "SKILL.md");
  await writeFile(dest, renderSkill(result, snapshot), "utf8");
  return dest;
}

export function renderSkill(result: AuditResult, snapshot: PageSnapshot): string {
  const h1 = snapshot.headings.find((h) => h.tag === "h1");
  const h2s = snapshot.headings.filter((h) => h.tag === "h2").map((h) => h.text);
  const fonts = uniq([...snapshot.declaredFonts, ...snapshot.computedFonts]).slice(0, 8);
  const colors = uniq([...snapshot.backgrounds, ...snapshot.colors]).slice(0, 10);
  const radii = uniq(snapshot.radii).slice(0, 6);
  const pads = uniq(snapshot.sectionPaddings).slice(0, 6);
  const findings = result.findings
    .map((f) => {
      const ev = f.evidence.map((e) => `  - \`${e.replace(/`/g, "'")}\``).join("\n");
      return `### ${f.category}: ${f.title} (−${f.deduction})\n${ev}`;
    })
    .join("\n\n");

  return `---
name: aftertaste
description: Concrete visual constraints derived from auditing this project's current UI. Use when restyling pages so the next pass does not repeat the same fonts, colors, copy, and layout.
---

# Aftertaste — do not ship this look again

Audited: ${snapshot.url}
Title: ${snapshot.title || "(untitled)"}
Score: ${result.score}/100 (${result.label})

${result.summary}

These are facts from the live page. Change the facts. Do not replace them with generic advice like "make it more unique" or "use a distinctive typeface."

## Fonts actually in use

${fonts.length ? fonts.map((f) => `- \`${f}\``).join("\n") : "- (none declared)"}
${snapshot.googleFonts.length ? snapshot.googleFonts.map((g) => `- Google Fonts: ${g}`).join("\n") : ""}

## Colors and surfaces actually in use

${colors.length ? colors.map((c) => `- \`${c}\``).join("\n") : "- (none sampled)"}

## Type and copy actually on the page

${h1 ? `- H1: "${h1.text}"` : "- no H1"}
${h2s.slice(0, 8).map((t) => `- H2: "${t}"`).join("\n")}
${snapshot.buttons.slice(0, 8).map((t) => `- CTA / link: "${t}"`).join("\n")}

Do not reuse "Welcome to", "unleash", "seamless", "next-generation", or "empower" on this product.

## Layout tells

- hero text-align: \`${snapshot.heroTextAlign || "?"}\`
- feature-card count: ${snapshot.featureCardCount}${snapshot.equalWidthCards ? " (equal width)" : ""}
- lucide: ${snapshot.hasLucide ? "yes" : "no"}; inline SVG count: ${snapshot.svgIconCount}
- border-radius: ${radii.map((r) => `\`${r}\``).join(", ") || "(none)"}
- section padding: ${pads.map((p) => `\`${p}\``).join("; ") || "(none)"}

${snapshot.samples
  .slice(0, 8)
  .map(
    (s) =>
      `- \`${s.selector}\` { font-family: ${s.fontFamily}; color: ${s.color}; background: ${s.background}; border-radius: ${s.borderRadius}; text-align: ${s.textAlign}; }`,
  )
  .join("\n")}

## Findings to kill on the next pass

${findings || "(none)"}

When you restyle, the next \`npx aftertaste <url>\` should not be able to cite the same CSS and the same sentences.
`;
}

function uniq(xs: string[]): string[] {
  const s = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const t = x.trim();
    if (!t || s.has(t)) continue;
    s.add(t);
    out.push(t);
  }
  return out;
}
