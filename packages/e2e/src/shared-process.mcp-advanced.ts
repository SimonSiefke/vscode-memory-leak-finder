import type { TestContext } from '../types.ts'


export const setup = async ({ Editor, Server }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Server.start({ port: 0, path: '/mcp' })
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  const serverUrl = Server.getUrl()
  const serverName = 'my-advanced-mcp-server'

  await MCP.addServer({
    serverUrl,
    serverName
  })
}

export const cleanup = async ({ Server }: TestContext): Promise<void> => {
  await Server.stop()
}
