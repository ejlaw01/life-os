# Life OS — Roadmap

A phased plan for building a personal AI-assisted life OS,
documented as a case study and portfolio piece.

---

## Phase 1: Foundation

Set up the repo, flat files, and start using the system daily.

- [ ] Initialize GitHub repo with README and CLAUDE.md
- [ ] Create ~/life/ directory structure
  - [ ] todos.md (seeded with current open items)
  - [ ] log.md (empty, timestamped entries start day one)
  - [ ] preferences.md (initial defaults)
- [ ] Create case study directories
  - [ ] decisions/
  - [ ] retrospectives/
  - [ ] JOURNAL.md
- [ ] Create mcp-planning.md (empty, patterns tracked over time)
- [ ] First commit with meaningful commit message
- [ ] Run first morning ritual with Claude Code

## Phase 2: Daily driver

Use the system consistently for 2+ weeks. Prove the habit before
adding complexity.

- [ ] Complete 5 consecutive morning rituals
- [ ] Complete 5 consecutive wind-down rituals
- [ ] Use yapper mode during at least 3 work sessions
- [ ] First weekly retrospective (Friday)
- [ ] First weekly system check-in
- [ ] Review and refine CLAUDE.md based on actual usage friction
- [ ] Write first decision doc (decisions/001_*.md)
- [ ] Identify first 3 recurring interaction patterns for MCP planning
- [ ] Update mcp-planning.md with observed tool candidates

## Phase 3: Case study scaffolding

Start shaping the public-facing narrative while the system is
still being used and refined.

- [ ] Write JOURNAL.md entries for at least 3 significant conversations
- [ ] Accumulate 3+ decision docs
- [ ] Draft case study outline (problem → approach → architecture → results)
- [ ] Identify key commits that tell the evolution story
- [ ] Make repo public (or prepare it for public visibility)

## Phase 4: MCP server design

Transition from flat files to structured tools. The spec comes
from V1 usage patterns, not guesswork.

- [ ] Finalize MCP tool list from mcp-planning.md
- [ ] Design Supabase schema (todos, log entries, preferences)
- [ ] Define MCP server architecture
  - [ ] Tool interfaces and input/output contracts
  - [ ] Auth and access patterns
  - [ ] Error handling strategy
- [ ] Write decision doc for data migration approach (flat files → Supabase)
- [ ] Write decision doc for MCP server tech choices

## Phase 5: MCP server build

Ship the portfolio centerpiece.

- [ ] Scaffold MCP server project
- [ ] Implement core tools
  - [ ] get_todos / add_todo / complete_todo
  - [ ] log_entry / query_log
  - [ ] get_preferences / update_preference
  - [ ] propose_top_three
- [ ] Implement calendar integration
  - [ ] get_calendar_today
  - [ ] add_event / check_conflicts
- [ ] Migrate data from flat files to Supabase
- [ ] Connect Claude Code to MCP server
- [ ] Test morning ritual through MCP tools
- [ ] Test wind-down ritual through MCP tools
- [ ] Test yapper mode through MCP tools

## Phase 6: Mobile endpoint

Screen-free morning ritual from the phone.

- [ ] Design phone endpoint architecture
- [ ] Build iOS Shortcut (triple-click → Ask Claude → Speak Text)
- [ ] Connect shortcut to Claude with MCP server
- [ ] Test full morning ritual via voice on phone
- [ ] Write decision doc for mobile architecture choices

## Phase 7: Web app (V3)

The client-facing demo piece. Built on the same MCP tools —
a client, not a rebuild.

- [ ] Design dashboard UI (today's top 3, log feed, calendar view)
- [ ] Scaffold Next.js project
- [ ] Implement dashboard views consuming MCP tools
- [ ] Polish for portfolio presentation
- [ ] Deploy to Vercel
- [ ] Add to Bit Lore portfolio as featured project

---

_Last updated: 2026-04-10_
