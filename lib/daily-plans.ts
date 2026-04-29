import sql from './db.js'

export async function saveDailyPlan(
  date: string,
  taskIds: string[],
  firstStep?: string,
) {
  const [plan] = await sql`
    INSERT INTO daily_plans (date, task_ids, first_step)
    VALUES (${date}, ${taskIds}, ${firstStep ?? null})
    ON CONFLICT (date) DO UPDATE
    SET task_ids = ${taskIds}, first_step = ${firstStep ?? null}
    RETURNING *
  `
  return plan
}

export async function getDailyPlan(date: string) {
  const [plan] = await sql`
    SELECT * FROM daily_plans
    WHERE date = ${date}
  `
  return plan ?? null
}
