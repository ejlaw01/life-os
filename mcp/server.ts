import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { tools } from '../lib/tools.js'

const server = new McpServer({
  name: 'life-os',
  version: '0.1.0',
})

for (const t of tools) {
  server.tool(
    t.name,
    t.description,
    t.schema.shape,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (input: any) => {
      const result = await t.handler(input)
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      }
    },
  )
}

const transport = new StdioServerTransport()
await server.connect(transport)
