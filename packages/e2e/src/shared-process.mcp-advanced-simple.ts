import type { TestContext } from '../types.ts'

let serverInfo: any = null

export const setup = async ({ Editor, MCP, Server }: TestContext): Promise<void> => {
  await Editor.closeAll()
  
  const mcpRequestHandler = MCP.createMCPServer({ path: '/mcp' })
  serverInfo = await Server.start({ port: 0, requestHandler: mcpRequestHandler })
}

export const run = async ({ MCP }: TestContext): Promise<void> => {
  const serverName = 'my-test-mcp-server'
  
  await MCP.addServer({
    serverUrl: serverInfo.url,
    serverName
  })
}

export const cleanup = async (): Promise<void> => {
  if (serverInfo) {
    await serverInfo.dispose()
  }
}
