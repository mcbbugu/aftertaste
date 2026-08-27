import type { AuditResult, Finding, PageSnapshot } from "./types.js";

const SLOP_FONTS: { name: string; re: RegExp; deduction: number; note: string }[] = [
  { name: "Inter", re: /\binter\b/i, deduction: 18, note: "the default AI sans" },
  { name: "Roboto", re: /\broboto\b/i, deduction: 15, note: "Material leftover as identity" },
  { name: "Space Grotesk", re: /space\s*grotesk/i, deduction: 14, note: "the 2024 substitute for Inter" },
  { name: "Plus Jakarta Sans", re: /plus\s*jakarta/i, deduction: 14, note: "startup-deck sans" },
  { name: "Arial", re: /\barial\b/i, deduction: 8, note: "no type choice was made" },
];

const COPY_TELLS: { re: RegExp; label: string; deduction: number }[] = [
  { re: /welcome\s+to\b/i, label: "Welcome to", deduction: 10 },
  { re: /\bunleash\b/i, label: "unleash", deduction: 6 },
  { re: /\bseamless\b/i, label: "seamless", deduction: 6 },
  { re: /next[-\s]generation/i, label: "next-generation", deduction: 6 },
  { re: /\bempower(?:s|ing|ed)?\b/i, label: "empower", deduction: 6 },
];

const CTA_RE = /^(get started|learn more|sign up free|start for free|try it now)$/i;
const GENERIC_H1 =
  /welcome to|the future of|all[- ]in[- ]one|platform for|reimagined|made simple/i;

function uniq(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of xs) {
    const k = x.trim();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

function blob(parts: string[]): string {
  return parts.join(" \n ");
}

function labelFor(score: number): string {
  if (score <= 20) return "peak slop";
  if (score <= 40) return "template residue";
  if (score <= 60) return "mixed";
  if (score <= 80) return "some taste";
  return "distinct";
}

function summarize(score: number, findings: Finding[]): string {
  if (score <= 20) {
    return "This page is the median of every AI landing page shipped this year. Nothing here could only belong to this product.";
  }
  if (score <= 40) {
    return "A few decisions exist, but the skeleton is still the default three-card hero the models keep reaching for.";
  }
  if (score <= 60) {
    return "Human and template are sharing the page. The leftover tells are listed below; kill those first.";
  }
  if (score <= 80) {
    return "Mostly a real design. The remaining tells are small — fix them so it cannot be mistaken for the default.";
  }
  if (findings.length === 0) {
    return "Looks like someone chose type, color, and structure on purpose.";
  }
  return "Distinct enough. The notes below are nits, not a costume.";
}

function fontBlob(s: PageSnapshot): string {
  return blob([...s.computedFonts, ...s.declaredFonts, ...s.googleFonts]);
}

function isSystemUiOnly(fonts: string[]): boolean {
  if (fonts.length === 0) return false;
  const named = fonts
    .flatMap((f) => f.split(","))
    .map((f) => f.replace(/["']/g, "").trim().toLowerCase())
    .filter(Boolean)
    .filter(
      (f) =>
        !["sans-serif", "serif", "monospace", "ui-sans-serif", "ui-serif", "system-ui"].includes(f),
    );
  const system = new Set([
    "system-ui",
    "-apple-system",
    "blinkmacsystemfont",
    "segoe ui",
    "helvetica neue",
    "helvetica",
    "arial",
    "noto sans",
    "ui-sans-serif",
  ]);
  const identity = named.filter((f) => !system.has(f));
  return identity.length === 0 && named.length > 0;
}

function looksPurpleIndigo(value: string): boolean {
  const v = value.toLowerCase();
  if (!v.includes("gradient") && !v.includes("rgb") && !v.includes("#")) return false;
  if (/indigo|violet|purple|fuchsia/.test(v)) return true;
  const hexes = v.match(/#([0-9a-f]{3,8})/gi) ?? [];
  for (const h of hexes) {
    const n = h.slice(1);
    const hex =
      n.length === 3
        ? n
            .split("")
            .map((c) => c + c)
            .join("")
        : n.slice(0, 6);
    if (hex.length < 6) continue;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if (b > 140 && r > 70 && r < 180 && b > g && b - r < 120) return true;
  }
  const rgb = [...v.matchAll(/rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)/g)];
  for (const m of rgb) {
    const r = Number(m[1]);
    const g = Number(m[2]);
    const b = Number(m[3]);
    if (b > 140 && r > 70 && r < 180 && b > g) return true;
  }
  return false;
}

function isGray50(value: string): boolean {
  const v = value.toLowerCase();
  if (/#f9fafb|#f8fafc|#f3f4f6|#fafafa/.test(v)) return true;
  if (/rgb\(\s*249\s*,\s*250\s*,\s*251/.test(v)) return true;
  if (/rgb\(\s*248\s*,\s*250\s*,\s*252/.test(v)) return true;
  return false;
}

function radiusLooksDefault(value: string): boolean {
  return /(^|[^\d])(12|16)px/.test(value);
}

export function scoreSnapshot(snapshot: PageSnapshot, screenshotPath: string | null = null): AuditResult {
  const findings: Finding[] = [];
  const fonts = fontBlob(snapshot);
  const text = blob([snapshot.bodyText, ...snapshot.headings.map((h) => h.text), ...snapshot.buttons]);

  const hitFonts = SLOP_FONTS.filter((f) => f.re.test(fonts));
  if (hitFonts.length) {
    const evidence = uniq([
      ...snapshot.declaredFonts.filter((x) => hitFonts.some((f) => f.re.test(x))),
      ...snapshot.computedFonts.filter((x) => hitFonts.some((f) => f.re.test(x))),
      ...snapshot.googleFonts.filter((x) => hitFonts.some((f) => f.re.test(x))),
      ...snapshot.samples
        .filter((s) => hitFonts.some((f) => f.re.test(s.fontFamily)))
        .slice(0, 3)
        .map((s) => `${s.selector} { font-family: ${s.fontFamily} }`),
    ]).slice(0, 6);
    const primary = hitFonts[0];
    findings.push({
      category: "fonts",
      title: `${hitFonts.map((f) => f.name).join(", ")} as the whole identity`,
      evidence: evidence.length ? evidence : [primary.note],
      deduction: Math.min(22, hitFonts.reduce((a, f) => a + f.deduction, 0)),
    });
  } else if (isSystemUiOnly([...snapshot.computedFonts, ...snapshot.declaredFonts])) {
    findings.push({
      category: "fonts",
      title: "system-ui is the entire type stack",
      evidence: uniq([...snapshot.declaredFonts, ...snapshot.computedFonts]).slice(0, 4),
      deduction: 10,
    });
  }

  const purple = uniq([...snapshot.backgrounds, ...snapshot.samples.map((s) => s.background)]).filter(
    looksPurpleIndigo,
  );
  if (purple.length) {
    findings.push({
      category: "palette",
      title: "purple / indigo gradient as the brand",
      evidence: purple.slice(0, 4),
      deduction: 18,
    });
  }

  const grayCards = uniq([...snapshot.backgrounds, ...snapshot.samples.map((s) => s.background)]).filter(isGray50);
  if (grayCards.length) {
    findings.push({
      category: "palette",
      title: "gray-50 cards",
      evidence: grayCards.slice(0, 3),
      deduction: 8,
    });
  }

  if (snapshot.featureCardCount >= 3 && snapshot.equalWidthCards) {
    const grid = snapshot.samples.find((s) => /1fr/i.test(s.gridTemplateColumns) || s.gridTemplateColumns.split(" ").length === 3);
    findings.push({
      category: "layout",
      title: "three equal feature cards",
      evidence: [
        `feature-card count: ${snapshot.featureCardCount}`,
        grid ? `${grid.selector} { grid-template-columns: ${grid.gridTemplateColumns} }` : "equal-width card row",
      ],
      deduction: 12,
    });
  }

  const ctas = snapshot.buttons.filter((b) => CTA_RE.test(b.trim()));
  const heroCentered = /center/i.test(snapshot.heroTextAlign);
  if (heroCentered && ctas.length >= 1) {
    findings.push({
      category: "layout",
      title: "centered hero + stock CTAs",
      evidence: [
        `hero text-align: ${snapshot.heroTextAlign}`,
        ...ctas.slice(0, 3).map((c) => `button: "${c}"`),
      ],
      deduction: 12,
    });
  }

  if (snapshot.hasLucide || snapshot.svgIconCount >= 3) {
    findings.push({
      category: "layout",
      title: snapshot.hasLucide ? "Lucide icon row" : "identical SVG icon row",
      evidence: [
        snapshot.hasLucide ? "lucide detected in DOM or stylesheet" : `inline SVG icons: ${snapshot.svgIconCount}`,
      ],
      deduction: 8,
    });
  }

  const pads = snapshot.sectionPaddings.map((p) => p.replace(/\s+/g, " ").trim()).filter(Boolean);
  const padCounts = new Map<string, number>();
  for (const p of pads) padCounts.set(p, (padCounts.get(p) ?? 0) + 1);
  const samePad = [...padCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (samePad && (samePad[1] >= 3 || (padCounts.size === 1 && pads.length >= 1))) {
    findings.push({
      category: "layout",
      title: "identical section padding",
      evidence: [`${samePad[1]} sections use padding: ${samePad[0]}`],
      deduction: 6,
    });
  }

  const radii = uniq(
    [...snapshot.radii, ...snapshot.samples.map((x) => x.borderRadius)].filter((r) => r && r !== "0px"),
  );
  const defaultR = radii.filter(radiusLooksDefault);
  if (radii.length > 0 && defaultR.length === radii.length) {
    findings.push({
      category: "layout",
      title: "radius 12 / 16 everywhere",
      evidence: uniq(defaultR).slice(0, 4),
      deduction: 8,
    });
  }

  const copyHits = COPY_TELLS.filter((t) => t.re.test(text));
  const h1 = snapshot.headings.find((h) => h.tag === "h1");
  const copyEvidence: string[] = [];
  if (h1) copyEvidence.push(`H1: "${h1.text}"`);
  for (const hit of copyHits) copyEvidence.push(`copy: "${hit.label}"`);
  const dashes = (snapshot.bodyText.match(/\u2014/g) ?? []).length;
  if (dashes >= 3) copyEvidence.push(`em dash × ${dashes}`);
  let copyDeduction = copyHits.reduce((a, h) => a + h.deduction, 0);
  if (h1 && GENERIC_H1.test(h1.text)) copyDeduction += 10;
  if (dashes >= 3) copyDeduction += 8;
  if (copyDeduction > 0) {
    findings.push({
      category: "copy",
      title: h1 && GENERIC_H1.test(h1.text) ? "generic H1 plus stock verbs" : "stock marketing verbs",
      evidence: copyEvidence.slice(0, 8),
      deduction: Math.min(28, copyDeduction),
    });
  }

  const fade = snapshot.keyframes.filter((k) => /fade/i.test(k));
  const anims = snapshot.animations.filter((a) => a && a !== "none");
  if (anims.length === 0 && snapshot.keyframes.length === 0) {
    findings.push({
      category: "motion",
      title: "no motion at all",
      evidence: ["no CSS animation or keyframes on the page"],
      deduction: 6,
    });
  } else if (fade.length || anims.every((a) => /fade/i.test(a))) {
    if (anims.length >= 2 || fade.length) {
      findings.push({
        category: "motion",
        title: "identical fade-in on every block",
        evidence: uniq([...fade, ...anims]).slice(0, 4),
        deduction: 8,
      });
    }
  }

  const total = findings.reduce((a, f) => a + f.deduction, 0);
  const score = Math.max(0, Math.min(100, 100 - total));
  return {
    url: snapshot.url,
    score,
    label: labelFor(score),
    summary: summarize(score, findings),
    findings,
    screenshotPath,
  };
}
