import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, MCP, Server }: TestContext): Promise<void> => {
  await Editor.closeAll()

  const mcpRequestHandler = MCP.createMCPServer({ path: '/mcp' })
  await Server.start({ port: 0, requestHandler: mcpRequestHandler })
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  const serverUrl = Server.getUrl()
  const serverName = 'my-test-mcp-server'

  await MCP.addServer({
    serverUrl,
    serverName
  })
}

export const cleanup = async ({ Server }: TestContext): Promise<void> => {
  await Server.stop()
}
