# 005: Auth — API Key + Supabase Service Role

**Date:** 2026-04-13
**Status:** Accepted

## Context

Two surfaces need protection: the Vercel API (public, hit by
the phone) and Supabase (hit by both Vercel and local MCP).
Single-user system.

## Decision

**API key for the public surface. Supabase service_role key
for the data layer. No user accounts, no JWT, no OAuth.**

### How it works

```
Phone → API key in header → Vercel → service_role → Supabase
Desktop → MCP locally → service_role → Supabase
```

- API key: random string stored as a Vercel env var. iOS
  Shortcut sends it as `Authorization: Bearer <key>` on every
  request. Vercel middleware checks it before processing.
- Supabase service_role key: used server-side by both Vercel
  functions and the local MCP server. Never exposed to clients.
- No row-level security. Single user — the API key is the
  access control. If you don't have it, you never reach
  Supabase.

### Migration path if multi-user is ever needed

- Swap API key for Supabase Auth (email/password or magic link)
- Add `user_id` column to every table
- Enable row-level security policies
- Lib functions take a `userId` param
- iOS Shortcut stores a session token instead of API key

Clear path, but not worth building until there's a second user.

## What we considered and rejected

- **Supabase Auth + RLS from day one** — adds a userId param
  to every function, a WHERE clause to every query, and RLS
  policies to every table, all returning the same single user.
  Complexity without benefit.
- **JWT / OAuth** — designed for multi-client, multi-user auth
  flows. Overkill for a single-user personal tool.
