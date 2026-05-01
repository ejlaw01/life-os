import type { VercelRequest, VercelResponse } from '@vercel/node'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { validateApiKey } from '../lib/auth.js'
import { getAll } from '../lib/preferences.js'
import { buildSystemPrompt } from '../lib/system-prompt.js'
import { tools as toolRegistry } from '../lib/tools.js'

const anthropic = new Anthropic()

const tools: Anthropic.Tool[] = toolRegistry.map((t) => ({
  name: t.name,
  description: t.description,
  input_schema: z.toJSONSchema(t.schema, {
    target: 'draft-7',
  }) as Anthropic.Tool['input_schema'],
}))

async function executeTool(
  name: string,
  input: Record<string, unknown>,
): Promise<unknown> {
  const tool = toolRegistry.find((t) => t.name === name)
  if (!tool) throw new Error(`Unknown tool: ${name}`)
  const parsed = tool.schema.parse(input)
  return tool.handler(parsed as never)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!validateApiKey(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const { input } = req.body
  if (!input || typeof input !== 'string') {
    return res.status(400).json({ error: 'Missing input' })
  }

  const preferences = await getAll()
  const systemPrompt = buildSystemPrompt(preferences)

  let messages: Anthropic.MessageParam[] = [{ role: 'user', content: input }]

  while (true) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages,
    })

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text')
      return res.status(200).json({
        response: textBlock?.text ?? '',
      })
    }

    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    if (toolUses.length === 0) {
      const textBlock = response.content.find((b) => b.type === 'text')
      return res.status(200).json({
        response: textBlock?.text ?? '',
      })
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults: Anthropic.ToolResultBlockParam[] = []
    for (const toolUse of toolUses) {
      if (toolUse.type !== 'tool_use') continue
      try {
        const result = await executeTool(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
        )
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
      } catch (e) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `Error: ${e instanceof Error ? e.message : String(e)}`,
          is_error: true,
        })
      }
    }

    messages.push({ role: 'user', content: toolResults })
  }
}
