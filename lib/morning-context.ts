import { listTodos } from './todos.js'
import { queryLog } from './log.js'
import { getDailyPlan } from './daily-plans.js'
import { getAll as getAllPreferences } from './preferences.js'

function previousDay(date: string) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export async function getMorningContext(date: string) {
  const yesterday = previousDay(date)

  const [todos, today_plan, yesterday_plan, recent_log, preferences] =
    await Promise.all([
      listTodos(),
      getDailyPlan(date),
      getDailyPlan(yesterday),
      queryLog({ limit: 20 }),
      getAllPreferences(),
    ])

  return {
    date,
    yesterday,
    todos,
    today_plan,
    yesterday_plan,
    recent_log,
    preferences,
  }
}
