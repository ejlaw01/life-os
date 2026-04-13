# 002: Supabase Schema Design

**Date:** 2026-04-13
**Status:** Accepted

## Context

V2 needs a data layer to replace the flat files from V1. The
schema should support the API endpoints defined in
decisions/001_architecture.md: todos, log, preferences, and
calendar.

## Decisions

### Four tables, no calendar table

**todos** — replaces todos.md. Supports categories, subtasks
via parent_id, and positional ordering. Two optional date
columns for scheduling flexibility (see below).

**daily_plans** — stores the confirmed top 3 from each morning
ritual as a historical snapshot. The wind-down ritual compares
the plan against what actually got completed. One row per day.

**log_entries** — replaces log.md. Freeform timestamped text.
No tags or categories — Claude can analyze entries on the fly
if pattern detection is needed.

**preferences** — replaces preferences.md. Key-value store.
Flexible for a single-user system where preferences are
freeform and evolving.

### No priority column on todos

Priority is inferred by Claude using the hierarchy in CLAUDE.md
(Bit Lore > AI Engineering > Personal > etc.) combined with
category and position. Storing priority would duplicate what
Claude already knows and create a sync problem when priorities
shift.

### Two date columns instead of one

Todos have `planned_before` (deadline — "before Friday") and
`planned_after` (deferred — "after Monday"), both nullable.

- Both null → no date constraint
- Both set to the same date → "on that day"
- Only `planned_before` → deadline without deferral
- Only `planned_after` → deferred without deadline

This lets the morning ritual skip deferred tasks that aren't
actionable yet and prioritize tasks with approaching deadlines.
A single `due_date` column can't express "don't show me this
until next week."

### Calendar reads from Google directly

No local calendar table. The API reads from Google Calendar at
query time and writes directly to Google Calendar when creating
events. Avoids sync, staleness, and duplication.

## Schema

```sql
create table todos (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  category        text not null,
  parent_id       uuid references todos(id),
  position        integer not null default 0,
  planned_before  date,
  planned_after   date,
  completed       boolean not null default false,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table daily_plans (
  id          uuid primary key default gen_random_uuid(),
  date        date unique not null,
  task_ids    uuid[] not null,
  first_step  text,
  created_at  timestamptz not null default now()
);

create table log_entries (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  created_at  timestamptz not null default now()
);

create table preferences (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,
  value       text not null,
  updated_at  timestamptz not null default now()
);
```

## What we considered and rejected

- **Tagged log entries** — adds friction to yapper mode for
  questionable query value. Claude can categorize on the fly.
- **Typed preference columns** — rigid, requires migration for
  every new preference. Key-value is better for a single-user
  system.
- **Calendar table** — duplicates Google Calendar data, creates
  sync problems.
- **Priority column on todos** — duplicates Claude's inference
  from CLAUDE.md hierarchy.
- **Single due_date column** — replaced by planned_before /
  planned_after. A single date can't express both deadlines and
  deferrals. "Do this before Friday" and "don't show me this
  until Monday" are different scheduling constraints.
