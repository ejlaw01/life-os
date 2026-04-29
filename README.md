# Life OS

A personal AI-assisted life operating system. Voice-first
daily planning, task management, and activity logging — powered
by Claude's API, deployed on Vercel, stored in Neon Postgres.

## How it works

You speak into an iOS Shortcut. Your voice is transcribed and
sent to a Vercel serverless function. The function calls
Claude's API, which interprets your intent and executes tools
against a Postgres database — adding todos, logging activity,
running morning rituals. Claude's response is sent back and
spoken aloud by the phone.

On desktop, Claude Code connects to the same database via a
local MCP server.

## Architecture

```
Phone → iOS Shortcut → POST /api/voice → Claude API → Neon Postgres
Desktop → Claude Code → MCP server → Neon Postgres
```

See `decisions/` for the full architectural story.

## Project structure

```
api/
  voice.ts             Vercel serverless function (single public endpoint)
lib/
  todos.ts             CRUD operations for todos
  log.ts               Activity log operations
  preferences.ts       Key-value preference store
  daily-plans.ts       Morning ritual plan snapshots
  auth.ts              API key validation
  db.ts                Postgres connection
  system-prompt.ts     Voice endpoint prompt (condensed from CLAUDE.md)
mcp/
  server.ts            Local MCP server for Claude Code (planned)
decisions/             Architectural decision records
CLAUDE.md              System prompt for Claude Code
ROADMAP.md             Phased build plan
JOURNAL.md             Case study entries
```

## Setup

### 1. Clone and install

```
git clone https://github.com/ejlaw01/life-os.git
cd life-os
npm install
```

### 2. Create a Neon database

- Sign up at [neon.tech](https://neon.tech)
- Create a project
- Run the schema SQL from `decisions/002_supabase_schema.md`
  in the Neon SQL editor

### 3. Set environment variables

Create `.env.local`:

```
DATABASE_URL=postgresql://...your-neon-connection-string...
ANTHROPIC_API_KEY=sk-ant-...your-key...
LIFE_OS_API_KEY=<generate with: openssl rand -hex 32>
```

### 4. Test locally

```
npx vercel dev --listen 3000 --yes
```

```
curl -X POST http://localhost:3000/api/voice \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-life-os-api-key>" \
  -d '{"input": "add a todo to buy groceries under Personal"}'
```

### 5. Deploy to Vercel

```
npx vercel login
npx vercel env add DATABASE_URL
npx vercel env add ANTHROPIC_API_KEY
npx vercel env add LIFE_OS_API_KEY
npx vercel --prod
```

### 6. iOS Shortcut

Create a Shortcut with these actions:

1. **Dictate Text**
2. **Get Contents of URL** — POST to your Vercel URL `/api/voice`
   with headers `Content-Type: application/json` and
   `Authorization: Bearer <key>`, body JSON with `input` set
   to Dictated Text
3. **Get Dictionary from Input** — from Contents of URL
4. **Get Dictionary Value** — key: `response`
5. **Speak Text** — speak the Dictionary Value

## Case study

This project is documented as a case study in building a
personal AI life OS. The commit history, decision records, and
journal entries tell the story of how the system evolved
through actual use.

Built by [Ethan Law](https://bitlore.io) — Bit Lore.
