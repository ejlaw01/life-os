# Life OS — Roadmap

A phased plan for building a personal AI-assisted life OS,
documented as a case study and portfolio piece.

---

## Phase 1: Foundation ✓

Set up the repo, flat files, and start using the system daily.

- [x] Initialize GitHub repo with README and CLAUDE.md
- [x] Create flat file structure
  - [x] todos.md (seeded with current open items)
  - [x] log.md (empty, timestamped entries start day one)
  - [x] preferences.md (initial defaults)
- [x] Create case study directories
  - [x] decisions/
  - [x] retrospectives/
  - [x] JOURNAL.md
- [x] Create mcp-planning.md (empty, patterns tracked over time)
- [x] First commit with meaningful commit message
- [ ] Run first morning ritual with Claude Code

## Phase 2: Daily driver

Use the system consistently. Prove the habit alongside
development.

- [ ] Complete 5 morning rituals
- [ ] Complete 5 wind-down rituals
- [ ] Use yapper mode during at least 3 work sessions
- [ ] First weekly retrospective (Friday)
- [ ] First weekly system check-in
- [ ] Review and refine CLAUDE.md based on actual usage friction
- [ ] Write first decision doc — ✓ decisions/001_architecture.md

## Phase 3: API server design

Design the hosted API that powers both phone and desktop.
See decisions/001_architecture.md for architecture rationale.

- [x] Finalize tool list and endpoint contracts
- [x] Design Supabase schema — decisions/002_supabase_schema.md
- [x] Define client paths and shared lib — decisions/003_client_paths.md
- [ ] Define auth strategy (API key)
- [ ] Write decision doc for data migration (flat files → Supabase)
- [ ] Write decision doc for Claude API integration pattern

## Phase 4: API server build

Ship the portfolio centerpiece.

- [ ] Scaffold Vercel project (TypeScript)
- [ ] Set up Supabase project and schema
- [ ] Implement shared lib
  - [ ] lib/todos.ts — addTodo, completeTodo, listTodos
  - [ ] lib/log.ts — addEntry, queryLog
  - [ ] lib/preferences.ts — get, set
  - [ ] lib/calendar.ts — getToday, addEvent
  - [ ] lib/supabase.ts — client setup
- [ ] Implement Vercel endpoints (adapters over lib)
  - [ ] POST /api/todos
  - [ ] POST /api/log
  - [ ] POST /api/preferences
  - [ ] POST /api/calendar
  - [ ] POST /api/voice — Claude API orchestration
- [ ] Auth middleware (API key validation)
- [ ] Deploy to Vercel
- [ ] Migrate data from flat files to Supabase

## Phase 5: Phone endpoint

Screen-free morning ritual from the phone.

- [ ] Build iOS Shortcut (trigger → dictation → API → speak)
- [ ] Test morning ritual via voice
- [ ] Test yapper mode via voice
- [ ] Test wind-down via voice
- [ ] Write decision doc for mobile UX choices

## Phase 6: Claude Code MCP wrapper

Connect Claude Code to the same API for desktop use.

- [ ] Build local MCP server (adapter over shared lib)
- [ ] Connect Claude Code to MCP server
- [ ] Test all rituals through MCP

## Phase 7: Case study

Shape the public-facing narrative.

- [ ] Write JOURNAL.md entries for significant conversations
- [ ] Accumulate 3+ decision docs
- [ ] Draft case study outline (problem → approach → architecture → results)
- [ ] Identify key commits that tell the evolution story
- [ ] Polish repo for public visibility

---

_Last updated: 2026-04-13_
_2026-04-13: Rewrote roadmap — dropped V3 web app, restructured
around hosted API + phone endpoint as primary deliverable
(see decisions/001_architecture.md)_
_2026-04-13: Supabase schema finalized — three tables, no
calendar table (see decisions/002_supabase_schema.md)_
_2026-04-13: Client paths finalized — shared lib with two
transport adapters (see decisions/003_client_paths.md)_
_2026-04-13: Project structure — single repo, flat layout,
no monorepo tooling (see decisions/004_project_structure.md)_
