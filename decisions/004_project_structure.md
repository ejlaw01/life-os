# 004: Project Structure — Single Repo, Flat Layout

**Date:** 2026-04-13
**Status:** Accepted

## Context

V2 introduces TypeScript code (shared lib, Vercel API endpoints,
local MCP server) alongside the existing flat files and case
study docs. Need to decide where the code lives and how it's
organized.

## Options considered

### Separate repos
life-os for docs/flat files, life-os-server for the API,
life-os-mcp for the MCP server. Clean separation but splits the
case study narrative across repos. Shared lib needs to be
published as a package or duplicated.

### Monorepo with workspaces (pnpm/Turborepo)
Packages managed by a monorepo tool. Overkill — workspaces
solve dependency hoisting problems that don't exist here. Three
packages sharing one local lib via relative imports don't need
package management.

### Single repo, flat layout (chosen)
Everything in one repo. Code in `lib/`, `api/`, `mcp/` folders.
One `package.json`, one `tsconfig.json`. Relative imports
between folders.

## Decision

**Single repo, flat layout.** No workspaces, no monorepo tools.

### Why

- One person, one project — no coordination overhead to justify
  tooling
- Shared lib is just TypeScript files imported via relative paths
- Commit history stays unified for the case study
- Vercel deploys `api/` as serverless functions
- MCP server runs locally from `mcp/`
- Simple enough for others to clone and understand

### Structure

```
life-os/
  CLAUDE.md, JOURNAL.md, todos.md, etc.   ← V1 flat files + docs
  api/                                     ← Vercel serverless functions
    voice.ts                               ← only public endpoint
  lib/                                     ← shared Supabase operations
    todos.ts
    log.ts
    preferences.ts
    calendar.ts
    daily-plans.ts
    supabase.ts
    system-prompt.ts
  mcp/                                     ← local MCP server
    server.ts
  package.json
  tsconfig.json
```

## What we considered and rejected

- **Separate repos** — splits case study narrative, forces
  shared lib into a published package or duplication.
- **pnpm/Turborepo workspaces** — solves dependency hoisting
  and build orchestration problems that don't exist at this
  scale. Adds config complexity for no benefit.
