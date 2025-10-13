import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  const server = await MCP.createMCPServer({ path: '/mcp' })

  const serverName = 'my-advanced-mcp-server'
  await MCP.addServer({
    serverUrl: server.url,
    serverName,
  })

  await MCP.removeServer(serverName)

  await serverInfo.dispose()
}
