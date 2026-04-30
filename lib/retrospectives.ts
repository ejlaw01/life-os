import sql from './db.js'

export async function saveRetrospective(week_start: string, content: string) {
  const [row] = await sql`
    INSERT INTO retrospectives (week_start, content)
    VALUES (${week_start}, ${content})
    ON CONFLICT (week_start) DO UPDATE
    SET content = ${content}
    RETURNING *
  `
  return row
}

export async function getRetrospective(week_start: string) {
  const [row] = await sql`
    SELECT * FROM retrospectives
    WHERE week_start = ${week_start}
  `
  return row ?? null
}

export async function listRetrospectives(limit?: number) {
  return sql`
    SELECT * FROM retrospectives
    ORDER BY week_start DESC
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `
}
