import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP }: TestContext): Promise<void> => {
  const server = await MCP.createMCPServer()
  await MCP.addServer({
    serverUrl: server.url,
    serverName: 'my-advanced-mcp-server',
  })

  await MCP.removeAllServers()

  await server.dispose()

  await new Promise((r) => {})
}
