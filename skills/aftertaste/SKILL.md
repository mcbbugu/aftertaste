---
name: aftertaste
description: Use after shipping UI or when a preview looks like generic AI slop. Run the aftertaste CLI against the live URL, then restyle from the concrete fonts, colors, and copy it found — not generic taste advice.
---

# Aftertaste

taste-skill tells the agent to have taste. aftertaste checks whether it did.

## When to use

- A localhost preview, staging URL, or landing page just shipped
- The UI looks like Inter + purple gradient + three equal cards
- You are about to write a Cursor skill from a real page instead of a generic design rant

## How to run

Needs Node 20+ and Playwright Chromium once:

```bash
npx tsx src/cli.ts http://localhost:5173
npx tsx src/cli.ts demo
npx tsx src/cli.ts http://localhost:5173 --skill
npx tsx src/cli.ts http://localhost:5173 --json --fail-under 70
```

Repo: https://github.com/mcbbugu/aftertaste

`--skill` writes `.cursor/skills/aftertaste/SKILL.md` with facts from this URL (font stack, gradient, H1, card layout). Use that generated file on the next restyle pass.

## What to do with the score

- 100 is distinct. 0 is peak template.
- Do not "make it nicer." Change the cited CSS and sentences so the next run cannot quote the same evidence.
- Ban on this pass: Inter/Roboto as the whole identity, purple-indigo hero, gray-50 equal cards, "Welcome to" / "unleash" / "seamless" / "empower".
