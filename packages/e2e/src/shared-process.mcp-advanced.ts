import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP }: TestContext): Promise<void> => {
  const serverName = 'my-advanced-mcp-server'
  const server = await MCP.createMCPServer()
  await MCP.addServer({
    serverUrl: server.url,
    serverName,
  })

  await MCP.removeServer(serverName)

  await server.dispose()
}
