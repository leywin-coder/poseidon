# Copilot Instructions for Gemini CLI

This file guides Copilot sessions working in the gemini-cli repository. For comprehensive AI-assisted development context, also see `CLAUDE.md` and `GEMINI.md` in the repository root.

## Quick Start

**First time?** Run: `node scripts/build.js` (installs dependencies and builds all packages)

**Before submitting changes:** Run `npm run preflight` (the heaviest check; does a full clean, install, build, lint, typecheck, and test suite)

## Build, Test & Lint

### Build Commands
- **Full build:** `npm run build` (TypeScript compilation to `dist/`, per-package, orchestrated by `scripts/build.js`)
- **Single package:** `npm run build -w @google/gemini-cli-core` (or replace with any other `@google/gemini-cli-*` package)
- **With sandbox & VS Code companion:** `npm run build:all` (adds sandbox container and VS Code extension)

### Test Commands
- **Unit tests (all packages):** `npm test` (runs `vitest run` for each package, then rebuilds)
- **Single test file:** `npx vitest run path/to/file.test.ts` (from repo root; path is relative to workspace root)
- **Filter test by name:** `npx vitest run -t "test name pattern"`
- **Workspace-specific tests:** `npm test -w @google/gemini-cli-core` (or other workspace package)
- **Integration tests (E2E):** `npm run test:e2e` (validates end-to-end CLI functionality)
- **Memory/perf regression:** `npm run test:memory` / `npm run test:perf` (nightly only; skip locally unless making changes to those areas)

### Lint & Format
- **Check linting:** `npm run lint`
- **Auto-fix linting:** `npm run lint:fix`
- **Format code:** `npm run format`
- **Type check:** `npm run typecheck`

## Monorepo Structure

**npm workspaces monorepo** (no Turborepo/Nx). Build order matters: `core` is the backend that everything else depends on, so it **must build first**. The build orchestrator (`scripts/build.js`) handles this automatically.

| Package | Role |
|---|---|
| `packages/core` | **Backend engine:** Gemini API client, scheduler + tool executor, routing, MCP support, policy, extensions, telemetry |
| `packages/cli` | **User-facing frontend:** Ink/React terminal UI, `gemini` binary, CLI config wiring, acp/rpc layer |
| `packages/sdk` | Public SDK mirroring core functionality for programmatic embedding |
| `packages/devtools` | Integrated DevTools UI bundle (Network/Console inspector) |
| `packages/a2a-server` | Experimental Agent-to-Agent HTTP server (A2A spec) |
| `packages/vscode-ide-companion` | VS Code extension pairing with the CLI |
| `packages/test-utils` | Shared test fixtures and test rig |

**Before editing any package, read its `GEMINI.md`** (e.g., `packages/core/GEMINI.md`). Each package has specific conventions and build instructions.

## Architecture Priorities

### Core Loop
- **Scheduler drives every agent turn:** `packages/core/src/scheduler/scheduler.ts` + `tool-executor.ts`
- **Tools live in:** `packages/core/src/tools/` or as extensions under `config/extensions/` — NOT UI concerns

### Package Boundaries
- **Core must never import CLI:** UI needs come as events/callbacks from core; CLI subscribes to them
- **Settings/telemetry/auth:** Live in `packages/core/src/config/` and `packages/core/src/telemetry/`. Settings are observable — watch them, don't read once.
- **No `console.log` for debugging the agent loop:** Output goes through Ink/React in `packages/cli/src/ui/`; diagnostics through telemetry or `runInDevTraceSpan` (see `docs/local-development.md`)

### Testing & Conventions
- **Tests mirror source:** `*.test.ts` sits next to the file under test in the same `src/` tree (no package-root `test/` directories)
- **Environment variables in tests:** Use `vi.stubEnv('NAME', 'value')` in `beforeEach` and `vi.unstubAllEnvs()` in `afterEach` — avoid modifying `process.env` directly (causes test leakage)
- **License headers required:** All new `.ts`, `.tsx`, `.js` files must include Apache-2.0 header with `Copyright 2026 Google LLC` (enforced by ESLint)

## Key Conventions

### Imports
- Use specific imports; avoid relative imports between packages (enforced by ESLint)
- Cross-package imports use `@google/gemini-cli-<package>` (e.g., `@google/gemini-cli-core`)

### Commits & PRs
- Follow [Conventional Commits](https://www.conventionalcommits.org/) standard
- Link PRs to existing GitHub issues (required; PRs without issues are auto-closed)
- Keep PRs small and focused (one feature or fix per PR)
- Sign the Google CLA before contributing

### Code Style
- TypeScript strict mode required
- Prettier + ESLint enforce formatting and linting (run before committing)
- React components use Ink for CLI rendering (not standard React)

## Development Tips

### Running Locally
- **Start the CLI in dev mode:** `npm start`
- **Debug with Node inspector:** `npm run debug` (inspect at `chrome://inspect`)
- **VS Code debug:** Use the "Attach" launch config (F5) or "Launch Program" in `.vscode/launch.json`
- **React DevTools:** Run `DEV=true npm start`, then `npx react-devtools@6` in another terminal

### Code Generation
- **Generate schemas before building:** `npm run generate` (creates git commit info and other generated code)

### Sandboxing (Optional)
- Set `GEMINI_SANDBOX=true` in `~/.env` to enable container-based sandboxing
- Supports `docker`, `podman`, or custom commands
- Builds minimal container on first `npm run build:all`; minimal overhead after that

### Review Tool
- **Before submitting PRs:** Run `./scripts/review.sh <PR_NUMBER>` to catch issues early
- Uses Gemini models to detect anti-patterns and common mistakes
- Authors should run this on their own PRs immediately after creation

## Common Tasks

### Adding a New Tool
1. Create a tool file in `packages/core/src/tools/` (mirroring the tool-executor flow)
2. Register it in the scheduler's tool registry
3. Add tests next to the implementation
4. Verify in `npm run test -w @google/gemini-cli-core`

### Modifying Settings
1. Update schema in `packages/core/src/config/settings/` (or define new settings module)
2. Ensure settings are observable; callers should watch them, not read once
3. Update documentation if user-facing

### Adding Dependencies
1. Update the workspace `package.json` or individual package's `package.json`
2. Run `npm install` to update lockfile
3. Run `npm run build` to verify the build works

### Running Eval Tests
- **Always-passing evals:** `npm run test:always_passing_evals`
- **All evals (requires secrets):** `cross-env RUN_EVALS=1 npm run test:all_evals` (needs `.env` with `GEMINI_API_KEY` and other secrets)

## CI/CD Awareness

- **Full validation before PRs:** `npm run preflight` (heavy; runs clean, install, format, build, lint:ci, typecheck, test:ci)
- **Memory/perf tests:** Run nightly on CI; skip locally unless you're changing performance-critical code
- **Integration tests:** Available in CI but require `GEMINI_API_KEY` secret (fork owners must add this GitHub Secret to enable them)

## MCP Server Integration

**Gemini CLI uses the Model Context Protocol (MCP) to extend capabilities.** MCP servers are discovered and managed by `packages/core/src/mcp/` and integrated through the tool executor.

### Key MCP Components
- **Discovery:** `packages/core/src/tools/mcp-client.ts` (`discoverMcpTools()`) — iterates configured servers, establishes connections, fetches tool definitions, validates schemas, registers in the tool registry
- **Execution:** `packages/core/src/tools/mcp-tool.ts` (`DiscoveredMCPTool`) — wraps each discovered MCP tool, handles confirmation logic, manages execution, processes responses
- **Resources:** MCP servers can expose resources (e.g., files, API payloads) in addition to tools; automatically discovered and referenceable with `@server://resource/path` syntax

### Transport Types Supported
- **Stdio:** Spawns subprocess, communicates via stdin/stdout
- **SSE:** Server-Sent Events endpoints
- **Streamable HTTP:** HTTP streaming communication

### Testing MCP Integration
- **List connected servers:** `/mcp list` (in CLI)
- **Discover new servers:** Changes to `~/.gemini/settings.json` `mcpServers` block are picked up on restart
- **Debug MCP tools:** Check `packages/core/src/mcp/` for client/server logic; integration tests verify tool discovery and execution

### Adding or Modifying MCP Support
1. Update discovery logic in `mcp-client.ts` if changing how servers are found
2. Modify `mcp-tool.ts` if changing how tools are executed or responses handled
3. Add tests in the same directory to verify connection handling and tool registration
4. Restart CLI to pick up configuration changes from `settings.json`

## Local Model Support (OpenAI-Compatible Endpoints)

Gemini CLI now supports **OpenAI-compatible endpoints** for running local models. Use any endpoint compatible with the OpenAI API format (e.g., Ollama, LM Studio, vLLM) by configuring it as the active provider.

### Quick Setup

Configure your local endpoint in `.gemini/settings.json`:

```json
{
  "modelConfig": {
    "providers": {
      "openai-compatible": {
        "baseUrl": "http://localhost:3001",
        "apiKey": "optional-key-if-needed"
      }
    }
  }
}
```

Then select it in the CLI:
```
/provider openai-compatible
```

### How It Works

- **Provider ID:** `openai-compatible`
- **Model Discovery:** Automatically fetches available models from `/v1/models` endpoint on your local server
- **Model Caching:** Models are cached for 5 minutes to reduce overhead
- **Requirements:** Your local server must implement the OpenAI `/v1/chat/completions` and `/v1/models` endpoints

### Example Configurations

**Ollama** (running on localhost:11434):
```json
{
  "modelConfig": {
    "providers": {
      "openai-compatible": {
        "baseUrl": "http://localhost:11434/v1",
        "apiKey": ""
      }
    }
  }
}
```

**LM Studio** (default port 1234):
```json
{
  "modelConfig": {
    "providers": {
      "openai-compatible": {
        "baseUrl": "http://localhost:1234/v1",
        "apiKey": ""
      }
    }
  }
}
```

**Custom Server with Auth**:
```json
{
  "modelConfig": {
    "providers": {
      "openai-compatible": {
        "baseUrl": "https://api.example.com/v1",
        "apiKey": "sk-your-secret-key"
      }
    }
  }
}
```

### Implementation Details

- **Provider Location:** `packages/core/src/core/providers/`
  - `openaiLlmProvider.ts` — Provider registration & model discovery
  - `openaiContentGenerator.ts` — Request/response translation
- **Streaming:** Full support for streaming responses
- **Token Counting:** Uses character-based estimation (~4 chars = 1 token) for local models
- **Error Handling:** Graceful fallback if model discovery fails

### Switching Between Providers

```bash
# List available providers in CLI
/provider

# Switch to local models
/provider openai-compatible

# Switch back to Gemini
/provider google

# Or use command-line flag
gemini --provider openai-compatible
```

### Troubleshooting

**"Failed to discover models"** — Ensure your local server is running and `/v1/models` endpoint is accessible.

**Connection refused** — Check the `baseUrl` matches your server's address and port.

**Empty model list** — Some servers require specific query parameters; check your server's documentation.

For comprehensive MCP setup and usage, see:
- **User guide:** `docs/tools/mcp-server.md` (configuration, examples)
- **Tutorial:** `docs/cli/tutorials/mcp-setup.md` (step-by-step setup with GitHub example)
- **Resources:** `docs/tools/mcp-resources.md` (resource discovery and referencing)

## Resources

- **Main docs:** `CLAUDE.md` (AI-assisted conventions), `GEMINI.md` (project context)
- **Architecture:** Each package has a `GEMINI.md` file with package-specific instructions
- **External docs:** https://geminicli.com/docs/
- **Contributing:** `CONTRIBUTING.md` (detailed process, CLA, PR guidelines)
- **Local development:** `docs/local-development.md`
- **Integration tests:** `docs/integration-tests/` (E2E test framework)
