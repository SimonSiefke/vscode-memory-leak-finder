import type { TestContext } from '../types.ts'


export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  const serverInfo = await Server.start({ port: 0, path: '/mcp' })

  const serverName = 'my-advanced-mcp-server'
  await MCP.addServer({
    serverUrl: serverInfo.url,
    serverName
  })

  await MCP.removeServer(serverName)

  await Server.stop()
}
