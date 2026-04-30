import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  addTodo,
  completeTodo,
  listTodos,
  updateTodo,
  deleteTodo,
} from '../lib/todos.js'
import { addEntry, queryLog } from '../lib/log.js'
import { set as setPreference } from '../lib/preferences.js'
import { saveDailyPlan, getDailyPlan } from '../lib/daily-plans.js'
import {
  saveRetrospective,
  getRetrospective,
  listRetrospectives,
} from '../lib/retrospectives.js'
import { getMorningContext } from '../lib/morning-context.js'

const server = new McpServer({
  name: 'life-os',
  version: '0.1.0',
})

server.tool(
  'addTodo',
  'Add a new todo item',
  {
    title: z.string(),
    category: z.string(),
    parent_id: z.string().optional(),
    planned_before: z.string().optional(),
    planned_after: z.string().optional(),
  },
  async ({ title, category, parent_id, planned_before, planned_after }) => {
    const todo = await addTodo(title, category, {
      parent_id,
      planned_before,
      planned_after,
    })
    return { content: [{ type: 'text', text: JSON.stringify(todo) }] }
  },
)

server.tool(
  'completeTodo',
  'Mark a todo as completed',
  { id: z.string() },
  async ({ id }) => {
    const todo = await completeTodo(id)
    return { content: [{ type: 'text', text: JSON.stringify(todo) }] }
  },
)

server.tool(
  'listTodos',
  'List todos, optionally filtered by category. Set include_completed=true for the full roadmap view (parent + children including done).',
  {
    category: z.string().optional(),
    include_completed: z.boolean().optional(),
  },
  async ({ category, include_completed }) => {
    const todos = await listTodos(category, { include_completed })
    return { content: [{ type: 'text', text: JSON.stringify(todos) }] }
  },
)

server.tool(
  'updateTodo',
  'Update fields on a todo',
  {
    id: z.string(),
    title: z.string().optional(),
    category: z.string().optional(),
    planned_before: z.string().optional(),
    planned_after: z.string().optional(),
    position: z.number().optional(),
  },
  async ({ id, ...fields }) => {
    const todo = await updateTodo(id, fields)
    return { content: [{ type: 'text', text: JSON.stringify(todo) }] }
  },
)

server.tool(
  'deleteTodo',
  'Delete a todo and its subtasks',
  { id: z.string() },
  async ({ id }) => {
    await deleteTodo(id)
    return { content: [{ type: 'text', text: 'Deleted' }] }
  },
)

server.tool(
  'addLogEntry',
  'Log a timestamped entry',
  { content: z.string() },
  async ({ content }) => {
    const entry = await addEntry(content)
    return { content: [{ type: 'text', text: JSON.stringify(entry) }] }
  },
)

server.tool(
  'queryLog',
  'Query recent log entries',
  {
    limit: z.number().optional(),
    since: z.string().optional(),
  },
  async ({ limit, since }) => {
    const entries = await queryLog({ limit, since })
    return { content: [{ type: 'text', text: JSON.stringify(entries) }] }
  },
)

server.tool(
  'setPreference',
  'Set a user preference',
  { key: z.string(), value: z.string() },
  async ({ key, value }) => {
    const pref = await setPreference(key, value)
    return { content: [{ type: 'text', text: JSON.stringify(pref) }] }
  },
)

server.tool(
  'saveDailyPlan',
  'Save the confirmed top 3 plan for a date',
  {
    date: z.string(),
    task_ids: z.array(z.string()),
    first_step: z.string().optional(),
  },
  async ({ date, task_ids, first_step }) => {
    const plan = await saveDailyPlan(date, task_ids, first_step)
    return { content: [{ type: 'text', text: JSON.stringify(plan) }] }
  },
)

server.tool(
  'getDailyPlan',
  'Get the daily plan for a date',
  { date: z.string() },
  async ({ date }) => {
    const plan = await getDailyPlan(date)
    return { content: [{ type: 'text', text: JSON.stringify(plan) }] }
  },
)

server.tool(
  'saveRetrospective',
  'Save a weekly retrospective. week_start is the Monday of the week (YYYY-MM-DD)',
  { week_start: z.string(), content: z.string() },
  async ({ week_start, content }) => {
    const row = await saveRetrospective(week_start, content)
    return { content: [{ type: 'text', text: JSON.stringify(row) }] }
  },
)

server.tool(
  'getRetrospective',
  'Get the retrospective for a given week (Monday YYYY-MM-DD)',
  { week_start: z.string() },
  async ({ week_start }) => {
    const row = await getRetrospective(week_start)
    return { content: [{ type: 'text', text: JSON.stringify(row) }] }
  },
)

server.tool(
  'listRetrospectives',
  'List recent retrospectives, newest first',
  { limit: z.number().optional() },
  async ({ limit }) => {
    const rows = await listRetrospectives(limit)
    return { content: [{ type: 'text', text: JSON.stringify(rows) }] }
  },
)

server.tool(
  'getMorningContext',
  'Load all morning-ritual context in one call: open todos, today and yesterday plans, recent log, preferences.',
  { date: z.string() },
  async ({ date }) => {
    const context = await getMorningContext(date)
    return { content: [{ type: 'text', text: JSON.stringify(context) }] }
  },
)

const transport = new StdioServerTransport()
await server.connect(transport)
