import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, MCP }: TestContext): Promise<void> => {
  await MCP.removeAllServers()
  await Editor.closeAll()
}

export const run = async ({ MCP, Editor }: TestContext): Promise<void> => {
  await MCP.addServer({
    serverName: 'my-advanced-mcp-server',
  })
  await Editor.closeAll()
  await MCP.removeAllServers()
}
