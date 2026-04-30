import sql from './db.js'

export async function addTodo(
  title: string,
  category: string,
  options?: {
    parent_id?: string
    planned_before?: string
    planned_after?: string
  },
) {
  const [todo] = await sql`
    INSERT INTO todos (title, category, parent_id, planned_before, planned_after)
    VALUES (
      ${title},
      ${category},
      ${options?.parent_id ?? null},
      ${options?.planned_before ?? null},
      ${options?.planned_after ?? null}
    )
    RETURNING *
  `
  return todo
}

export async function completeTodo(id: string) {
  const [todo] = await sql`
    UPDATE todos
    SET completed = true, completed_at = now(), updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  return todo
}

export async function listTodos(
  category?: string,
  options?: { include_completed?: boolean },
) {
  const todos = await sql`
    SELECT *
    FROM todos
    WHERE 1=1
    ${options?.include_completed ? sql`` : sql`AND completed = false`}
    AND (planned_after IS NULL OR planned_after <= CURRENT_DATE)
    ${category ? sql`AND category = ${category}` : sql``}
    ORDER BY category, position, completed_at
  `
  return todos
}

export async function updateTodo(
  id: string,
  fields: {
    title?: string
    category?: string
    planned_before?: string | null
    planned_after?: string | null
    position?: number
  },
) {
  const [todo] = await sql`
    UPDATE todos
    SET ${sql(fields, ...(Object.keys(fields) as (keyof typeof fields)[]))}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `
  return todo
}

export async function deleteTodo(id: string) {
  await sql`
    DELETE FROM todos
    WHERE id = ${id}
  `
}
