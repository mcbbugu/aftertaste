import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { scoreSnapshot } from "../src/score.ts";
import type { PageSnapshot } from "../src/types.ts";

const dir = path.dirname(fileURLToPath(import.meta.url));

function load(name: string): PageSnapshot {
  return JSON.parse(readFileSync(path.join(dir, "fixtures", name), "utf8")) as PageSnapshot;
}

test("slop fixture scores as peak slop with cited evidence", () => {
  const result = scoreSnapshot(load("slop.json"));
  assert.ok(result.score <= 25, `expected <= 25, got ${result.score}`);
  assert.equal(result.label, "peak slop");
  const cats = new Set(result.findings.map((f) => f.category));
  assert.ok(cats.has("fonts"));
  assert.ok(cats.has("palette"));
  assert.ok(cats.has("layout"));
  assert.ok(cats.has("copy"));
  assert.ok(cats.has("motion"));
  const blob = result.findings.flatMap((f) => f.evidence).join("\n");
  assert.match(blob, /Inter/i);
  assert.match(blob, /Welcome to NexusForge/);
  assert.match(blob, /667eea|#667eea|102, 126, 234/i);
  assert.match(blob, /Get started/);
});

test("craft fixture scores as distinctive", () => {
  const result = scoreSnapshot(load("craft.json"));
  assert.ok(result.score >= 75, `expected >= 75, got ${result.score}`);
  const blob = result.findings.flatMap((f) => f.evidence).join("\n");
  assert.doesNotMatch(blob, /Inter/);
  assert.doesNotMatch(blob, /Welcome to/);
  assert.doesNotMatch(blob, /Get started/);
});

test("score is clamped 0-100", () => {
  const slop = load("slop.json");
  const result = scoreSnapshot(slop);
  assert.ok(result.score >= 0 && result.score <= 100);
});
