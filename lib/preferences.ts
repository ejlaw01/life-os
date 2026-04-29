import sql from './db.js'

export async function get(key: string) {
  const [row] = await sql`
    SELECT value FROM preferences
    WHERE key = ${key}
  `
  return row?.value ?? null
}

export async function getAll(): Promise<{ key: string; value: string }[]> {
  const rows = await sql`
    SELECT key, value FROM preferences
    ORDER BY key
  `
  return rows as unknown as { key: string; value: string }[]
}

export async function set(key: string, value: string) {
  const [row] = await sql`
    INSERT INTO preferences (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE
    SET value = ${value}, updated_at = now()
    RETURNING *
  `
  return row
}
