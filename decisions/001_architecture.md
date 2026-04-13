# 001: V2 Architecture — Hosted API + Claude Orchestration

**Date:** 2026-04-13
**Status:** Accepted

## Context

V2 needs to serve two clients: Claude Code on desktop and an
iOS Shortcut on the phone. The phone endpoint is the highest
priority feature — screen-free morning ritual, yapper mode
via voice, wind-down from the couch.

## Options considered

### A — Local stdio MCP server
TypeScript MCP server runs locally, Claude Code spawns it.
Talks directly to Supabase. Simple to build but only works
where Claude Code runs. No path to phone without a separate
deployment.

### B — Hosted HTTP server (chosen)
Vercel serverless API. iOS Shortcut and Claude Code both hit
it over HTTPS. Server calls Claude API with tool definitions,
executes tools against Supabase, returns composed responses.

### C — Supabase Edge Functions as the server
Each tool is an Edge Function with a thin MCP wrapper locally.
Elegant but coupled to Supabase's runtime and rough DX.

### D — Local now, deploy later
Start with A, swap transport when phone needs it. Pragmatic
but delays the phone endpoint, which is the priority.

## Decision

**Option B — Hosted HTTP API on Vercel with Claude API
orchestration.**

### Why

- Phone endpoint works from day one
- Server owns the full pipeline: receives request → calls
  Claude API with tool definitions → executes tools against
  Supabase → returns response
- Not dependent on Claude iOS app's MCP support (uncertain,
  could change)
- Stronger portfolio piece — demonstrates API design, Claude
  tool use integration, and a real deployed backend
- Vercel is familiar and free tier is sufficient for single-user
- Claude Code can still use a local MCP wrapper that hits the
  same API, or talk to Supabase directly

### Architecture

```
┌─────────────┐
│ iOS Shortcut │
└──────┬──────┘
       │ POST /api/voice
       ▼
┌──────────────┐     ┌────────────┐
│  Vercel API  │────▶│ Claude API │
│  (TypeScript) │◀────│            │
│              │     └────────────┘
│  ┌────────┐  │
│  │  lib/  │──┼────▶ Supabase
│  └────────┘  │
└──────────────┘         ▲
                         │
┌─────────────┐          │
│ Claude Code  │          │
└──────┬──────┘          │
       │ MCP             │
       ▼                 │
┌──────────────┐         │
│ Local MCP    │         │
│  ┌────────┐  │         │
│  │  lib/  │──┼─────────┘
│  └────────┘  │
└──────────────┘
```

Both paths share the same `lib/` — core Supabase operations
written once. Vercel and MCP are thin transport adapters.
See decisions/003_client_paths.md for full rationale.

### Endpoints

Public:
```
POST /api/voice        → freeform voice input (Claude parses
                         intent, calls lib functions)
POST /api/todos        → direct CRUD
POST /api/log          → direct CRUD
POST /api/preferences  → direct CRUD
POST /api/calendar     → direct CRUD
```

### Shared lib

```
lib/todos.ts           → addTodo, completeTodo, listTodos
lib/log.ts             → addEntry, queryLog
lib/preferences.ts     → get, set
lib/calendar.ts        → getToday, addEvent
lib/supabase.ts        → client setup
```

### Auth

Single API key in request header. Stored as Vercel env var.
Sufficient for single-user system.

## What we dropped

**V3 (web dashboard)** — the MCP server + phone endpoint is the
real portfolio piece. A Next.js dashboard would be a client demo
but doesn't add meaningful value to the case study. Can revisit
if there's a reason.

## Tradeoffs

- Vercel serverless functions have cold starts — acceptable for
  a personal tool with low traffic
- Vercel has execution time limits (10s free, 60s pro) — all
  tools are short request/response, not a concern
- If real-time features are ever needed (live dashboard, etc.),
  would need a persistent server. Not relevant without V3.
