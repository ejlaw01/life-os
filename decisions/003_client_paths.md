# 003: Client Paths — Phone via Vercel, Desktop via MCP

**Date:** 2026-04-13
**Status:** Accepted

## Context

Two clients need to interact with the same data in Supabase:
an iOS Shortcut (phone) and Claude Code (desktop). Each has
different capabilities, so each takes a different path.

## Decision

### Phone → Vercel API → Claude API + Supabase

The iOS Shortcut is a dumb client. It can capture voice as
text and make a single HTTP request. It cannot:
- Call the Claude API with tool definitions
- Handle multi-turn tool-call orchestration
- Run the MCP protocol

So Vercel acts as the middleman. The phone sends one request
to a `/api/voice` endpoint. The Vercel function orchestrates
the full Claude conversation server-side:

1. Receives voice input
2. Sends input + system prompt + tool definitions to Claude API
3. Claude responds with a tool call
4. Executes the tool against Supabase
5. Sends result back to Claude
6. Repeats until Claude has a final response
7. Returns the spoken response to the Shortcut

The system prompt sent to Claude is a condensed version of
CLAUDE.md — ritual logic, pet filter, priority hierarchy,
response style. Preferences are loaded from Supabase at
request time.

### Desktop → MCP → Supabase directly

Claude Code is already an MCP client and already does
reasoning locally. It doesn't need Vercel as a middleman.
A local MCP server exposes tools (add_todo, log_entry, etc.)
that read/write Supabase directly.

Claude Code handles the orchestration natively — the tool-call
loop that Vercel runs for the phone is exactly what Claude Code
already does with MCP tools.

## Architecture

```
┌─────────────┐
│ iOS Shortcut │
└──────┬──────┘
       │ POST /api/voice
       ▼
┌──────────────┐     ┌────────────┐
│  Vercel API  │────▶│ Claude API │
│              │◀────│            │
│              │     └────────────┘
│              │
│              │────▶ Supabase
└──────────────┘

┌─────────────┐
│ Claude Code  │
└──────┬──────┘
       │ MCP protocol
       ▼
┌──────────────┐
│ Local MCP    │
│ server       │────▶ Supabase
└──────────────┘
```

## Alternatives considered

### Phone calls Claude API directly
iOS Shortcut would need to handle multi-turn tool orchestration.
Shortcuts can't do this. Also puts the API key on the device.

### Skip Claude on phone, just CRUD
Basic parsing instead of Claude. Loses intelligence — pet
filter, ritual logic, ambiguous input handling. Building a
worse version of what Claude provides.

### Single API for both clients, no MCP
Desktop also goes through Vercel. Adds unnecessary network
latency and token costs for every desktop interaction. Claude
Code already does local reasoning for free.

## Implications

- Vercel API only needs one public endpoint: `/api/voice`
- CRUD endpoints are internal functions called by the Claude
  orchestration loop, not exposed publicly
- MCP server is a separate local package, not deployed
- Both paths share the same Supabase instance
- System prompt (`lib/system-prompt.ts`) and CLAUDE.md will
  drift over time. Both files should reference the other —
  when ritual logic changes in one, check the other. Add to
  commit discipline.
