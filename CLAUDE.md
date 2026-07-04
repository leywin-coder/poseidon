# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`gemini-cli` is an npm-workspaces monorepo (no Turborepo/Nx). The `core`
package is the backend everything else depends on, so it must be built first.
Build is LLVM-style per-package `tsc` producing `dist/`, orchestrated by
`scripts/build.js` (core first, then the rest in parallel; sequential on CI).

| Package | Role | Per-package instructions |
|---|---|---|
| `packages/cli` | Entry point: Ink/React UI, `gemini` bin, acp/rpc, config wiring | `packages/cli/GEMINI.md` |
| `packages/core` | Agent core: LLM client, scheduler + tool executor, routing, MCP, policy, extensions, telemetry, skills | `packages/core/GEMINI.md` |
| `packages/sdk` | Public SDK mirroring core | `packages/sdk/GEMINI.md` |
| `packages/devtools` | DevTools UI bundle | `packages/devtools/GEMINI.md` |
| `packages/a2a-server` | Agent-to-Agent HTTP server (A2A spec) | `packages/a2a-server/GEMINI.md` |
| `packages/vscode-ide-companion` | VS Code extension companion | `packages/vscode-ide-companion/GEMINI.md` |
| `packages/test-utils` | Shared test fixtures | `packages/test-utils/GEMINI.md` |

Before editing any package, read its `GEMINI.md`. The repo's runtime itself
loads these files as hierarchical context (`docs/cli/gemini.md`); they carry
instructions that matter for understanding each package.

## Common commands

Run from repo root unless noted.

```bash
# First-time setup. Auto-runs npm install if node_modules is missing.
node scripts/build.js

# Generate code from .ts schemas before building.
npm run generate

# Build / typecheck a single package.
npm run build -w @google/gemini-cli-core
npm run typecheck -w @google/gemini-cli-core

# Run a package's tests.
npm test -w @google/gemini-cli-core
npm test -w @google/gemini-cli-cli

# Run a single test file or grep a test name.
npx vitest run path/to/file.test.ts
npx vitest run -t "test name pattern"

# Full preflight (heavy; run once before PRs).
npm run preflight
```

Package `test` scripts run `vitest run` then `posttest: npm run build`. The
VS Code companion additionally supports `test:ci` with coverage.

## Architecture priorities

- **Scheduler is the core loop.** `packages/core/src/scheduler/scheduler.ts`
  + `tool-executor.ts` drive every agent turn. Tools live in
  `packages/core/src/tools` or as extensions under `config/extensions` — they
  are not UI concerns.
- **Core must never import the CLI.** Model UI needs as events/callbacks
  coming out of core; let the CLI subscribe.
- **Settings/telemetry/auth** live in `packages/core/src/config` and
  `packages/core/src/telemetry`. Settings are observable — watch them, don't
  read once.
- **Don't use `console.log` to debug the agent loop.** Output goes through
  Ink/React components in `packages/cli/src/ui`; diagnostics go through the
  telemetry system (`packages/core/src/telemetry`) or `runInDevTraceSpan`
  (see `docs/local-development.md`).
- **Tests mirror source.** `*.test.ts` sits next to the file under test in the
  same `src/` tree. There are no package-root `test/` directories.
- **License headers required** on new `.ts`, `.tsx`, `.js` files — Apache-2.0
  with `Copyright 2026 Google LLC`. Enforced by ESLint.

## Notes

- Use OpenHarness tools deliberately. Keep changes minimal and verify with
  tests when possible.
- Behavioral evals live under `evals/` and need `RUN_EVALS=1` plus secrets from
  `.env`. Memory/perf regression tests are nightly — don't run them locally
  unless you're touching those areas.
