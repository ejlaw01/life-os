import { addTodo, completeTodo, listTodos, updateTodo, deleteTodo } from './lib/todos.js'
import { addEntry, queryLog } from './lib/log.js'
import { set, get, getAll } from './lib/preferences.js'
import { saveDailyPlan, getDailyPlan } from './lib/daily-plans.js'
import sql from './lib/db.js'

async function test() {
  console.log('--- todos ---')
  const todo = await addTodo('Test todo', 'Personal')
  console.log('add:', todo.title, todo.id)

  const child = await addTodo('Sub task', 'Personal', { parent_id: todo.id })
  console.log('add child:', child.title, '→ parent', child.parent_id)

  const updated = await updateTodo(todo.id, { title: 'Updated todo' })
  console.log('update:', updated.title)

  const todos = await listTodos()
  console.log('list:', todos.length, 'open')

  const filtered = await listTodos('Personal')
  console.log('list (Personal):', filtered.length)

  const completed = await completeTodo(todo.id)
  console.log('complete:', completed.title, 'at', completed.completed_at)

  await deleteTodo(todo.id)
  console.log('delete: cascade removed parent + child')

  console.log('\n--- log ---')
  const entry = await addEntry('Test log entry')
  console.log('add:', entry.content)

  const logs = await queryLog({ limit: 1 })
  console.log('query:', logs.length, 'entries')

  await sql`DELETE FROM log_entries WHERE id = ${entry.id}`

  console.log('\n--- preferences ---')
  await set('test_key', 'test_value')
  const val = await get('test_key')
  console.log('set/get:', val)

  const all = await getAll()
  console.log('getAll:', all.length, 'prefs')

  await sql`DELETE FROM preferences WHERE key = 'test_key'`

  console.log('\n--- daily plans ---')
  const plan = await saveDailyPlan('2026-01-01', [todo.id], 'First step')
  console.log('save:', plan.date, plan.task_ids.length, 'tasks')

  const fetched = await getDailyPlan('2026-01-01')
  console.log('get:', fetched?.first_step)

  await sql`DELETE FROM daily_plans WHERE date = '2026-01-01'`

  console.log('\n✓ all tests passed')
  await sql.end()
}

test().catch((e) => {
  console.error('FAILED:', e.message)
  process.exit(1)
})
