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
