import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { validateApiKey } from '../lib/auth.js'
import { getAll } from '../lib/preferences.js'
import { buildSystemPrompt } from '../lib/system-prompt.js'
import {
  addTodo,
  completeTodo,
  listTodos,
  updateTodo,
  deleteTodo,
} from '../lib/todos.js'
import { addEntry, queryLog } from '../lib/log.js'
import { saveDailyPlan, getDailyPlan } from '../lib/daily-plans.js'
import { set as setPreference } from '../lib/preferences.js'

const anthropic = new Anthropic()

const tools: Anthropic.Tool[] = [
  {
    name: 'addTodo',
    description: 'Add a new todo item',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'The todo title' },
        category: { type: 'string', description: 'Category to file under' },
        parent_id: {
          type: 'string',
          description: 'Parent todo ID for subtasks',
        },
        planned_before: {
          type: 'string',
          description: 'Deadline date (YYYY-MM-DD)',
        },
        planned_after: {
          type: 'string',
          description: 'Deferred until date (YYYY-MM-DD)',
        },
      },
      required: ['title', 'category'],
    },
  },
  {
    name: 'completeTodo',
    description: 'Mark a todo as completed',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The todo ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'listTodos',
    description: 'List open todos, optionally filtered by category',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: { type: 'string', description: 'Filter by category' },
      },
      required: [],
    },
  },
  {
    name: 'updateTodo',
    description: 'Update fields on a todo',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The todo ID' },
        title: { type: 'string' },
        category: { type: 'string' },
        planned_before: { type: 'string' },
        planned_after: { type: 'string' },
        position: { type: 'number' },
      },
      required: ['id'],
    },
  },
  {
    name: 'deleteTodo',
    description: 'Delete a todo and its subtasks',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'The todo ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'addLogEntry',
    description: 'Log a timestamped entry',
    input_schema: {
      type: 'object' as const,
      properties: {
        content: { type: 'string', description: 'The log entry text' },
      },
      required: ['content'],
    },
  },
  {
    name: 'queryLog',
    description: 'Query recent log entries',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max entries to return' },
        since: {
          type: 'string',
          description: 'Return entries after this date (YYYY-MM-DD)',
        },
      },
      required: [],
    },
  },
  {
    name: 'setPreference',
    description: 'Set a user preference',
    input_schema: {
      type: 'object' as const,
      properties: {
        key: { type: 'string' },
        value: { type: 'string' },
      },
      required: ['key', 'value'],
    },
  },
  {
    name: 'saveDailyPlan',
    description: 'Save the confirmed top 3 plan for a date',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
        task_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of todo IDs for the top 3',
        },
        first_step: { type: 'string', description: 'First 10-minute step' },
      },
      required: ['date', 'task_ids'],
    },
  },
  {
    name: 'getDailyPlan',
    description: 'Get the daily plan for a date',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      },
      required: ['date'],
    },
  },
]

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'addTodo':
      return addTodo(input.title as string, input.category as string, {
        parent_id: input.parent_id as string | undefined,
        planned_before: input.planned_before as string | undefined,
        planned_after: input.planned_after as string | undefined,
      })
    case 'completeTodo':
      return completeTodo(input.id as string)
    case 'listTodos':
      return listTodos(input.category as string | undefined)
    case 'updateTodo': {
      const { id, ...fields } = input
      return updateTodo(id as string, fields)
    }
    case 'deleteTodo':
      return deleteTodo(input.id as string)
    case 'addLogEntry':
      return addEntry(input.content as string)
    case 'queryLog':
      return queryLog({
        limit: input.limit as number | undefined,
        since: input.since as string | undefined,
      })
    case 'setPreference':
      return setPreference(input.key as string, input.value as string)
    case 'saveDailyPlan':
      return saveDailyPlan(
        input.date as string,
        input.task_ids as string[],
        input.first_step as string | undefined,
      )
    case 'getDailyPlan':
      return getDailyPlan(input.date as string)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!validateApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { input } = req.body
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input' })
  }

  const preferences = await getAll()
  const systemPrompt = buildSystemPrompt(preferences)

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: input }]

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text')
      return res.status(200).json({
        response: textBlock?.text ?? '',
      })
    }

    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    if (toolUses.length === 0) {
      const textBlock = response.content.find((b) => b.type === 'text')
      return res.status(200).json({
        response: textBlock?.text ?? '',
      })
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const toolUse of toolUses) {
      if (toolUse.type !== 'tool_use') continue
      try {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        )
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Error: ${e instanceof Error ? e.message : String(e)}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: 'user', content: toolResults })
  }
}
