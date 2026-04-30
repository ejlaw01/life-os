# 007: Morning Context Tool — Single MCP Call for the Ritual

**Date:** 2026-04-30
**Status:** Accepted

## Context

Day one of V2 use surfaced a real latency problem in the morning
ritual. Bringing up the top-3 took roughly a minute. Three causes,
ranked by contribution:

1. **Round-trip count.** The ritual currently issues separate MCP
   calls for `listTodos`, `getDailyPlan`, and `queryLog`, with
   model reasoning between each. Each round-trip is a model turn
   plus a DB query.
2. **Cold connection on the first query.** The MCP server is
   spawned per Claude Code session and pays Neon TLS + handshake
   on the first call.
3. **Tool lazy-loading on the harness side.** Some MCP tools
   aren't pre-loaded into the model's context. Not fixable in
   this repo.

There was also a missing capability: no MCP tool exposed
preferences for *reading*. Step 6 of the ritual (check
`reminders.*`) was being skipped silently.

## Decision

Add a `getMorningContext(date)` MCP tool that returns all
ritual-relevant data in a single call, with the underlying lib
queries running in parallel.

### Returned shape

```ts
{
  date: string             // today, as passed
  yesterday: string        // computed previous day
  todos: Todo[]            // open, planned_after-filtered
  today_plan: DailyPlan | null
  yesterday_plan: DailyPlan | null
  recent_log: LogEntry[]   // last 20 entries
  preferences: Pref[]      // all preferences; caller filters
}
```

### Why this shape

- **Yesterday's plan** is included so the ritual can detect a
  missed wind-down (plan exists, no wind-down log entry) without
  a second round-trip.
- **All preferences** rather than just `reminders.*` — payload is
  small, and other prefixes (`priorities.*`, `work_patterns.*`,
  `who_i_am.*`) inform top-3 selection. One trip serves the whole
  ritual.
- **Workday logic stays in the model.** The tool returns yesterday
  unconditionally; the ritual decides whether to chase a missed
  wind-down based on day-of-week.

## Options considered

### A — Status quo (rejected)
Keep separate calls. Simple but the latency is real and noticed
on day one of use.

### B — Aggregate MCP tool (chosen)
One call, parallel lib queries, returns a bundle.

### C — Aggregate API endpoint
Add `GET /api/morning-context` so the iOS Shortcut can use it too.
Worth doing eventually but the phone goes through Claude API
orchestration, not direct CRUD. Not needed today.

## Tradeoffs

- **Coupling.** This tool knows about todos, plans, log, and
  preferences. That's the point — it's a ritual-shaped facade.
  If the ritual changes, the tool changes. Acceptable for a tool
  that's explicitly named for the ritual.
- **Payload size.** Returning all preferences is unbounded in
  theory. In practice prefs are small key/value rows. If they
  grow large, swap to prefix-filtered fetching.
- **Cold connection still hits.** First MCP call in a session
  still pays the handshake. But it pays it once instead of three
  times.

## Follow-ups

- Update `CLAUDE.md` morning ritual instructions to call
  `getMorningContext` instead of three separate tools. (Pending
  user approval per the change-proposal rule.)
- Consider an analogous `getWindDownContext` if the wind-down
  ritual shows the same pattern.
