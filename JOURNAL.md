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

---

## 2026-04-13: Claude API integration pattern

Voice endpoint orchestration: validate key, fetch preferences
from Supabase, inject into system prompt, send to Claude with
tools, loop tool calls until text response, return to phone.

System prompt lives in `lib/system-prompt.ts` — separate from
CLAUDE.md. Different context (voice vs desktop), different needs.
Preferences loaded and injected on every request so Claude
always has full context.

No pet filter in voice prompt — phone input is intentional,
unlike desktop transcription that might pick up background noise.

Captured in decisions/006_claude_api_integration.md.

**All Phase 3 design questions resolved.** Ready to build.

---

## 2026-04-13: Auth — API key + service role

Single API key protects the public Vercel surface. Supabase
service_role key used server-side by both Vercel and MCP. No
user accounts, no JWT, no RLS. If multi-user is ever needed,
the migration path is clear (add user_id, enable RLS, swap to
Supabase Auth) but not worth building for one user.

Captured in decisions/005_auth.md.

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

---

## 2026-04-30: V2 day one — the ritual is too slow

First full day on V2. Ran the morning ritual and noticed it took
roughly a minute to come back with a proposed top 3.

Diagnosed three causes:

1. The ritual makes three separate MCP calls (todos, plan, log)
   with model reasoning between each.
2. Cold Postgres connection on the first query in a fresh MCP
   session.
3. Some MCP tool schemas aren't pre-loaded into the model's
   context, so the harness lazy-fetches them mid-flow. Not
   something this repo can fix.

Also caught a real gap: no MCP tool exposed preferences for
reading, only writing. Step 6 of the ritual ("check `reminders.*`
and apply any that are due") was being silently skipped.

Added a `getMorningContext(date)` MCP tool that returns todos,
today's plan, yesterday's plan, recent log, and all preferences
in one call, with the lib queries running in parallel. One trip
instead of three, and the ritual finally has visibility into
preferences.

Captured in decisions/007_morning_context_tool.md. CLAUDE.md
ritual update pending — proposed but not yet applied.

**Case-study moment:** the system noticed its own latency on
day one and grew a tool to address it. This is exactly the
"every repeated interaction is a candidate tool" pattern
CLAUDE.md flags.

---

## 2026-04-30: Progress is a UX problem

Caught two related UX failures during the afternoon's work session.

**1.** Mid-day I deleted a redundant child todo (`d181d731`,
search-replace URLs) when the user clarified it was the same
issue as the staging redirect subtask. Looked tidy in the
moment. Wrong move — the deletion erased visible progress.
The user wanted to see it *checked off*, not gone. The reward
is watching `[x]` accumulate through the day.

**2.** When surfacing a child todo in chat, I was rendering it
as a flat checkbox without its parent or sibling context. That
strips the larger goal from view. If today's plan touches a
leaf, the right rendering is the parent group with all its
children, completed and open both.

Both fixes landed:

- New rules in CLAUDE.md `## Rules`: mark complete throughout
  the day, sweep at wind-down, don't delete child todos while
  the parent is still open.
- Memory rule (chat-only) for parent + sibling context rendering.
- `listTodos` gained an `include_completed` flag so the rendering
  layer can actually fetch the full picture, not just open items.

Restored `d181d731` as a completed sibling under "Staging
environment setup" so the day's accumulated progress is intact.

**Case-study moment:** day two of V2 surfaces a more interesting
class of issue than day one. Day one was about latency — pure
mechanics. Day two is about progress visibility — a UX/psychology
question the system has to answer for the user to actually trust
it. The data layer was fine; the rendering layer wasn't telling
the right story.

---

## 2026-05-01: Two tool registries was one too many

Caught architectural drift between the two clients. The MCP
server (desktop) and the `/api/voice` Vercel function (phone)
each maintained their own list of tools — same `lib/` underneath,
but two parallel tool-definition surfaces with two parallel
handler dispatches.

The drift had already accumulated:

- `getMorningContext`, `recordCompletedWork`, the
  `include_completed` flag on `listTodos`, and all three
  retrospective tools were MCP-only.
- The phone — *the* surface for the morning ritual — couldn't
  call the tool actually designed for the morning ritual.

Refactored both consumers to read from a single registry,
`lib/tools.ts`. Each tool defines name, description, Zod schema,
and handler exactly once. MCP registers them by walking the list;
the API derives JSON Schema from the same Zod definitions via
`z.toJSONSchema` and dispatches by name. Net deletion of ~150
lines.

**Architectural lesson:** when two surfaces share a backend, the
surfaces themselves want a shared registry too. Otherwise every
new feature has to be implemented twice and someone has to
remember it. The drift is silent until a user notices the phone
can't do something the desktop can.

**Case-study moment:** day three of V2 surfaces the third class
of issue. Day one was latency. Day two was progress visibility.
Day three is multi-surface drift — a class of bug that doesn't
show up in tests because both surfaces pass their own. The fix
isn't just "add the missing tools to the API"; it's structural,
so this class can't recur.
