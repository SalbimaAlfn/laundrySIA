<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Token Efficiency and Project Continuity

- Keep changes focused; reuse project patterns and dependencies. Inspect only relevant files and avoid unrelated refactors.
- For Next.js changes, read the relevant guide in `node_modules/next/dist/docs/` before coding; verify APIs against the installed version.
- Before substantial work, read the relevant `PROJECT_MEMORY.md` sections, then verify current code. Keep memory concise, factual, and limited to durable context; distinguish facts from open questions and never store secrets.
- Run focused checks appropriate to the change and report only verified results, meaningful changes, and blockers.
