// Your file to implement.
// See decisions/006_claude_api_integration.md for the full pattern.
//
// Flow:
//   1. Validate API key (use lib/auth.ts)
//   2. Parse input from request body: { input: string }
//   3. Fetch preferences from Supabase (lib/preferences.ts getAll)
//   4. Build system prompt (lib/system-prompt.ts)
//   5. Call Claude API with system prompt + tool definitions + input
//   6. Loop: if Claude returns tool_use, execute against lib/,
//      send result back. Repeat until text response.
//   7. Return { response: string } to the phone
//
// Tool definitions should match the lib functions:
//   addTodo, completeTodo, listTodos, addLogEntry, queryLog,
//   setPreference, saveDailyPlan, getDailyPlan
//
// No getPreferences tool — preferences are injected into the
// system prompt.

import type { VercelRequest, VercelResponse } from '@vercel/node'
