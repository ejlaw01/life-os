import type { VercelRequest } from '@vercel/node'

export function validateApiKey(req: VercelRequest): boolean {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return false

  const key = process.env.LIFE_OS_API_KEY
  if (!key) return false

  return header.slice(7) === key
}
