export type CliArgs = {
  url: string | null;
  demo: boolean;
  json: boolean;
  skill: boolean;
  out: string;
  failUnder: number | null;
  help: boolean;
  version: boolean;
};

export function helpText(): string {
  return [
    "aftertaste — taste-skill tells the agent to have taste. aftertaste checks whether it did.",
    "",
    "Usage:",
    "  aftertaste <url>",
    "  aftertaste demo",
    "  aftertaste --help",
    "",
    "Flags: --json  --skill  --out <dir>  --fail-under <n>  --version",
    "",
  ].join("\n");
}

export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    url: null,
    demo: false,
    json: false,
    skill: false,
    out: ".aftertaste",
    failUnder: null,
    help: false,
    version: false,
  };
  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--version" || a === "-v") args.version = true;
    else if (a === "--json") args.json = true;
    else if (a === "--skill") args.skill = true;
    else if (a === "--out") args.out = rest[++i] ?? args.out;
    else if (a === "--fail-under") args.failUnder = Number(rest[++i]);
    else if (a === "demo") args.demo = true;
    else if (a.startsWith("-")) throw new Error("unknown flag: " + a);
    else args.url = a;
  }
  return args;
}
