# Journal

Dated entries from significant conversations and decisions.

---

## 2026-04-13: Architecture decision — hosted API on Vercel

Discussed V2 architecture options. Key driver: phone endpoint
is the highest priority feature, not desktop.

Evaluated four options (local stdio, hosted HTTP, Supabase edge
functions, local-now-deploy-later). Chose hosted HTTP on Vercel
with Claude API orchestration because:

- Phone works from day one without depending on Claude iOS MCP support
- Server owns the full pipeline (stronger portfolio piece)
- Vercel is familiar and free
- Not reliant on third-party configuration that could change

Also decided to drop V3 (web dashboard). The API server + phone
endpoint is the real portfolio piece. A dashboard would be a
client demo but doesn't add meaningful value.

Captured in decisions/001_architecture.md. Roadmap rewritten to
reflect the new structure.

**Open questions:**
- Claude API integration pattern (tool definitions, prompt structure)
- Auth details beyond "API key in header"
- Whether Claude Code uses MCP wrapper → Vercel API, or talks to
  Supabase directly

---

## 2026-04-13: Supabase schema design

Three tables: todos, log_entries, preferences. No calendar table
— read/write Google Calendar directly.

Key decisions:
- No priority column on todos — Claude infers from CLAUDE.md
  hierarchy + category + position
- Due dates optional — only the todos that have them matter for
  overdue detection
- Log entries are pure freeform text — no tags, Claude categorizes
  on the fly if needed
- Preferences as key-value, not typed columns — flexible for a
  single-user system

Captured in decisions/002_supabase_schema.md.

---

## 2026-04-13: Client paths and shared lib

Each client takes the path that fits its capabilities:

- Phone → `/api/voice` → Claude API parses intent → shared lib
  → Supabase. One Shortcut, one tap. Claude is the intelligent
  layer because the phone can't orchestrate tool calls.
- Desktop → Claude Code → MCP → shared lib → Supabase. Claude
  Code is already the intelligent layer — no need for Vercel.

Key design decision: core Supabase operations live in `lib/`.
Both the Vercel endpoints and the MCP server are thin adapters
over the same functions. Logic written once, two transports.

CRUD endpoints are also public — the voice endpoint uses them
internally via Claude, but they're accessible directly too.

Captured in decisions/003_client_paths.md. Updated architecture
diagram in decisions/001_architecture.md.

**Open questions:**
- Claude API integration pattern (system prompt, tool-call loop)
- Auth details

---

## 2026-04-13: Project structure — single repo, flat layout

Decided to keep everything in one repo with a flat folder
structure: `lib/`, `api/`, `mcp/` alongside the existing flat
files. One `package.json`, one `tsconfig.json`, relative imports.

Rejected separate repos (splits case study) and monorepo
tooling like pnpm workspaces or Turborepo (solves problems
that don't exist at this scale).

Captured in decisions/004_project_structure.md.

---

## 2026-04-13: First morning ritual — timestamp trust issue

Ran the first morning ritual and yapper mode session. Caught an
immediate design flaw: Claude was fabricating timestamps for
log.md entries instead of checking the system clock. All three
entries were wrong by over an hour.

This is a good early finding. A life OS that logs inaccurate
timestamps is worse than no log at all — you can't spot time
patterns in bad data. Fixed by adding a rule to always run
`date +%H:%M` before writing any log entry.

**Takeaway for V2:** The Vercel API should attach server-side
timestamps to log entries, not rely on the client or the LLM.
Timestamps are infrastructure, not conversation.

---

## 2026-04-13: Client paths — phone vs desktop

Each client takes the path that fits its capabilities:

- Phone (iOS Shortcut) → Vercel API → Claude API + Supabase.
  The phone is a dumb client — can only make HTTP requests.
  Vercel orchestrates the Claude tool-call loop server-side.
  Single public endpoint: `/api/voice`.
- Desktop (Claude Code) → local MCP server → Supabase directly.
  Claude Code already handles orchestration natively via MCP.
  No need for Vercel as middleman.

Key insight: the Vercel API exists specifically because the phone
can't run the multi-turn tool-call conversation that Claude needs.
Desktop doesn't have this limitation.

CRUD endpoints are internal to the Vercel function, not public.
Both paths share the same Supabase instance.

Captured in decisions/003_client_paths.md.
