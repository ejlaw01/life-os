import sql from './db.js'

export async function addEntry(content: string) {
  const [entry] = await sql`
    INSERT INTO log_entries (content)
    VALUES (${content})
    RETURNING *
  `
  return entry
}

export async function queryLog(options?: { limit?: number; since?: string }) {
  if (options?.since) {
    return sql`
      SELECT * FROM log_entries
      WHERE created_at >= ${options.since}
      ORDER BY created_at DESC
      ${options.limit ? sql`LIMIT ${options.limit}` : sql``}
    `
  }

  return sql`
    SELECT * FROM log_entries
    ORDER BY created_at DESC
    ${options?.limit ? sql`LIMIT ${options.limit}` : sql``}
  `
}
