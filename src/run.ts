import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import { capturePage } from "./capture.js";
import { renderReport } from "./report.js";
import { scoreSnapshot } from "./score.js";
import { writeSkill } from "./skill.js";
import type { CliArgs } from "./args.js";
import { helpText, parseArgs } from "./args.js";

function toUrl(input: string): string {
  if (/^https?:\/\//i.test(input) || input.startsWith("file:")) return input;
  return pathToFileURL(path.resolve(input)).href;
}

export function demoUrl(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = path.resolve(here, "../demo/slop.html");
  return pathToFileURL(file).href;
}

export async function run(argv = process.argv): Promise<number> {
  let args: CliArgs;
  try {
    args = parseArgs(argv);
  } catch (err) {
    console.error((err as Error).message);
    return 1;
  }
  if (args.help) {
    process.stdout.write(helpText());
    return 0;
  }
  if (args.version) {
    process.stdout.write("aftertaste " + VERSION + "\n");
    return 0;
  }
  const url = args.demo ? demoUrl() : (args.url ? toUrl(args.url) : null);
  if (!url) {
    process.stdout.write(helpText());
    return 1;
  }

  const captured = await capturePage(url, path.resolve(args.out));
  const result = scoreSnapshot(captured.snapshot, captured.screenshotPath);

  if (args.skill) {
    const dest = await writeSkill(result, captured.snapshot);
    if (!args.json) process.stderr.write("wrote " + dest + "\n");
  }

  if (args.json) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    process.stdout.write(renderReport(result) + "\n");
  }

  if (args.failUnder != null && Number.isFinite(args.failUnder) && result.score < args.failUnder) {
    return 1;
  }
  return 0;
}

export const VERSION = "0.1.0";
