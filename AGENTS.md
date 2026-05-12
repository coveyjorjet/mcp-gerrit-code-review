# AGENTS.md

## Project

MCP Server for Gerrit code review. Provides 19 tools across 4 categories (changes, accounts, projects, server) for AI agents to interact with Gerrit via stdio transport.

## Commands

```
npm install          # Install deps
npm run build        # Compile TS -> dist/ (required before running)
npm run dev          # Watch-mode rebuild
npm test             # Run vitest once
npm run test:watch   # Watch-mode tests
npm run lint         # Type-check only (tsc --noEmit)
npm start            # Run compiled server: node dist/index.js
```

No linter/formatter beyond TypeScript strict mode. No CI config.

## Architecture

```
src/index.ts            — Entry point. Creates McpServer, GerritClient, registers tools, connects stdio transport
src/gerrit/client.ts    — GerritClient: wraps fetch, prefixes paths with /a, strips )]}' response prefix, Basic Auth
src/gerrit/types.ts     — TypeScript interfaces for Gerrit API responses
src/tools/changes.ts    — 13 change tools (query, details, files, diff, review, comments, submit, abandon, restore, reviewers)
src/tools/accounts.ts   — 2 account tools (get, query)
src/tools/projects.ts   — 2 project tools (list, get)
src/tools/server.ts     — 2 server tools (info, version)
src/utils/parsing.ts    — stripGerritPrefix(), parseNetrc(), resolveCredentials()
tests/client.test.ts    — Vitest tests for parsing utils and GerritClient
```

## Key Patterns

- **Tool registration**: Each `src/tools/*.ts` exports a `registerXxxTools(server, client)` function that calls `server.registerTool()`
- **Input validation**: All tool inputs use Zod schemas
- **Gerrit API**: All paths are prefixed with `/a` (authenticated endpoints). Responses start with `)]}'\n` magic prefix — always stripped via `stripGerritPrefix()`
- **Credentials**: Resolved from `GERRIT_URL`/`GERRIT_USERNAME`/`GERRIT_PASSWORD` env vars, falling back to `~/.netrc`
- **ESM**: `"type": "module"` in package.json. All imports use `.js` extension (not `.ts`)
- **Tests**: Use `vi.resetModules()` + dynamic `import()` to test GerritClient with different env vars

## Mutation Tools

These tools modify Gerrit state — confirm with user before calling:
- `post_review`, `post_review_comment`, `submit_change`, `abandon_change`, `restore_change`, `add_reviewer`

## Testing

- Single test file: `tests/client.test.ts`
- Tests mock `fetch` globally via `vi.stubGlobal("fetch", ...)`
- GerritClient tests require module reset between cases due to credential resolution at construction time
- Tests directory excluded from `tsconfig.json` compilation

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
