# 006: Claude API Integration Pattern

**Date:** 2026-04-13
**Status:** Accepted

## Context

The `/api/voice` endpoint orchestrates a conversation between
the phone's voice input and Claude. Need to decide how the
system prompt is structured, where it lives, and how Claude
gets runtime context.

## Decisions

### System prompt in a separate file

The voice endpoint's system prompt lives in
`lib/system-prompt.ts` — imported, not hardcoded. This prompt
is a condensed subset of CLAUDE.md, optimized for voice:

- Ritual logic (morning, wind-down, yapper)
- Priority hierarchy
- Response style (brief, spoken-word, no markdown)
- Injected preferences from Supabase

The divergence from CLAUDE.md is intentional. CLAUDE.md drives
Claude Code on the desktop with full context (case study, repo
conventions, system evolution). The voice prompt drives a
phone interaction — different context, different needs.

### Load and inject preferences

On every request, the voice endpoint fetches all preferences
from Supabase and injects them into the system prompt before
sending to Claude. Claude always has the full picture without
needing to decide when to fetch.

One extra DB query per request. Negligible for a single-user
system with a few requests per day.

Alternative was giving Claude a `getPreferences` tool and
letting it pull on demand. Less reliable — Claude might not
think to check, and "what should I cook" fails if it doesn't
know you're vegetarian.

### Tool-call loop

The voice endpoint implements the standard Claude API
tool-use loop:

```
1. Receive voice input, validate API key
2. Fetch preferences from Supabase
3. Build system prompt (static template + preferences)
4. Send system prompt + tool definitions + user input → Claude
5. If Claude responds with text → return to phone
6. If Claude responds with tool call(s) → execute against
   Supabase, send results back to Claude
7. Repeat from step 5 until text response
```

A single voice request may trigger multiple tool calls.
Morning ritual needs listTodos + getDailyPlan at minimum.
The loop handles this transparently.

### Tool definitions

Same operations as the shared lib, exposed as Claude tool
schemas:

```
addTodo(title, category, parent_id?, planned_before?,
        planned_after?)
completeTodo(id)
listTodos(category?)
addLogEntry(content)
queryLog(limit?, since?)
getPreferences()
setPreference(key, value)
getCalendarToday()
addEvent(title, start, end)
checkConflicts(start, end)
saveDailyPlan(date, task_ids, first_step?)
getDailyPlan(date)
```

### Response format

Claude's final text response is returned as-is to the iOS
Shortcut for Speak Text. Responses must be:

- Brief and spoken-word friendly
- No markdown formatting (no bullets, headers, bold)
- Natural sentence structure

This is enforced in the system prompt, not in code.

## What we considered and rejected

- **System prompt hardcoded in voice endpoint** — buries
  configuration in handler code. Harder to review and update.
- **Preferences fetched on-demand by Claude** — less reliable.
  Claude might not think to check preferences before answering
  context-dependent questions.
- **Shared system prompt with CLAUDE.md** — different contexts
  need different prompts. Desktop has case study, repo
  conventions, file operations. Phone has voice-optimized
  ritual logic.
