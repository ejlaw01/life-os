# 002: Supabase Schema Design

**Date:** 2026-04-13
**Status:** Accepted

## Context

V2 needs a data layer to replace the flat files from V1. The
schema should support the API endpoints defined in
decisions/001_architecture.md: todos, log, preferences, and
calendar.

## Decisions

### Three tables, no calendar table

**todos** — replaces todos.md. Supports categories, subtasks
via parent_id, optional due dates, and positional ordering.

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

### Due dates are optional

Most todos won't have them. The ones that do are the ones that
matter for the morning ritual's overdue detection.

### Calendar reads from Google directly

No local calendar table. The API reads from Google Calendar at
query time and writes directly to Google Calendar when creating
events. Avoids sync, staleness, and duplication.

## Schema

```sql
create table todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  category    text not null,
  parent_id   uuid references todos(id),
  position    integer not null default 0,
  due_date    date,
  completed   boolean not null default false,
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
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
