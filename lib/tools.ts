import { z } from 'zod'
import {
  addTodo,
  completeTodo,
  listTodos,
  updateTodo,
  deleteTodo,
  recordCompletedWork,
} from './todos.js'
import { addEntry, queryLog } from './log.js'
import { set as setPreference } from './preferences.js'
import { saveDailyPlan, getDailyPlan } from './daily-plans.js'
import {
  saveRetrospective,
  getRetrospective,
  listRetrospectives,
} from './retrospectives.js'
import { getMorningContext } from './morning-context.js'

type ToolDef<S extends z.ZodObject = z.ZodObject> = {
  name: string
  description: string
  schema: S
  handler: (input: z.infer<S>) => Promise<unknown>
}

function defineTool<S extends z.ZodObject>(def: ToolDef<S>): ToolDef<S> {
  return def
}

export const tools = [
  defineTool({
    name: 'addTodo',
    description: 'Add a new todo item',
    schema: z.object({
      title: z.string().describe('The todo title'),
      category: z.string().describe('Category to file under'),
      parent_id: z.string().optional().describe('Parent todo ID for subtasks'),
      planned_before: z.string().optional().describe('Deadline date (YYYY-MM-DD)'),
      planned_after: z.string().optional().describe('Deferred until date (YYYY-MM-DD)'),
    }),
    handler: async ({ title, category, parent_id, planned_before, planned_after }) =>
      addTodo(title, category, { parent_id, planned_before, planned_after }),
  }),

  defineTool({
    name: 'completeTodo',
    description: 'Mark a todo as completed',
    schema: z.object({
      id: z.string().describe('The todo ID'),
    }),
    handler: async ({ id }) => completeTodo(id),
  }),

  defineTool({
    name: 'listTodos',
    description:
      'List todos, optionally filtered by category. Set include_completed=true for the full roadmap view (parent + children including done).',
    schema: z.object({
      category: z.string().optional().describe('Filter by category'),
      include_completed: z
        .boolean()
        .optional()
        .describe('Include completed todos for the roadmap view'),
    }),
    handler: async ({ category, include_completed }) =>
      listTodos(category, { include_completed }),
  }),

  defineTool({
    name: 'updateTodo',
    description: 'Update fields on a todo',
    schema: z.object({
      id: z.string().describe('The todo ID'),
      title: z.string().optional(),
      category: z.string().optional(),
      planned_before: z.string().optional(),
      planned_after: z.string().optional(),
      position: z.number().optional(),
    }),
    handler: async ({ id, ...fields }) => updateTodo(id, fields),
  }),

  defineTool({
    name: 'deleteTodo',
    description: 'Delete a todo and its subtasks',
    schema: z.object({
      id: z.string().describe('The todo ID'),
    }),
    handler: async ({ id }) => {
      await deleteTodo(id)
      return { deleted: id }
    },
  }),

  defineTool({
    name: 'recordCompletedWork',
    description:
      'Add a todo already marked complete — for work that came up and got done in the same breath. One round trip instead of addTodo + completeTodo.',
    schema: z.object({
      title: z.string(),
      category: z.string(),
      parent_id: z.string().optional(),
    }),
    handler: async ({ title, category, parent_id }) =>
      recordCompletedWork(title, category, { parent_id }),
  }),

  defineTool({
    name: 'addLogEntry',
    description: 'Log a timestamped entry',
    schema: z.object({
      content: z.string().describe('The log entry text'),
    }),
    handler: async ({ content }) => addEntry(content),
  }),

  defineTool({
    name: 'queryLog',
    description: 'Query recent log entries',
    schema: z.object({
      limit: z.number().optional().describe('Max entries to return'),
      since: z
        .string()
        .optional()
        .describe('Return entries after this date (YYYY-MM-DD)'),
    }),
    handler: async ({ limit, since }) => queryLog({ limit, since }),
  }),

  defineTool({
    name: 'setPreference',
    description: 'Set a user preference',
    schema: z.object({
      key: z.string(),
      value: z.string(),
    }),
    handler: async ({ key, value }) => setPreference(key, value),
  }),

  defineTool({
    name: 'saveDailyPlan',
    description: 'Save the confirmed top 3 plan for a date',
    schema: z.object({
      date: z.string().describe('Date (YYYY-MM-DD)'),
      task_ids: z.array(z.string()).describe('Array of todo IDs for the top 3'),
      first_step: z.string().optional().describe('First 10-minute step'),
    }),
    handler: async ({ date, task_ids, first_step }) =>
      saveDailyPlan(date, task_ids, first_step),
  }),

  defineTool({
    name: 'getDailyPlan',
    description: 'Get the daily plan for a date',
    schema: z.object({
      date: z.string().describe('Date (YYYY-MM-DD)'),
    }),
    handler: async ({ date }) => getDailyPlan(date),
  }),

  defineTool({
    name: 'saveRetrospective',
    description:
      'Save a weekly retrospective. week_start is the Monday of the week (YYYY-MM-DD)',
    schema: z.object({
      week_start: z.string(),
      content: z.string(),
    }),
    handler: async ({ week_start, content }) =>
      saveRetrospective(week_start, content),
  }),

  defineTool({
    name: 'getRetrospective',
    description: 'Get the retrospective for a given week (Monday YYYY-MM-DD)',
    schema: z.object({
      week_start: z.string(),
    }),
    handler: async ({ week_start }) => getRetrospective(week_start),
  }),

  defineTool({
    name: 'listRetrospectives',
    description: 'List recent retrospectives, newest first',
    schema: z.object({
      limit: z.number().optional(),
    }),
    handler: async ({ limit }) => listRetrospectives(limit),
  }),

  defineTool({
    name: 'getMorningContext',
    description:
      'Load all morning-ritual context in one call: open todos, today and yesterday plans, recent log, preferences.',
    schema: z.object({
      date: z.string().describe('Today (YYYY-MM-DD)'),
    }),
    handler: async ({ date }) => getMorningContext(date),
  }),
] as const
