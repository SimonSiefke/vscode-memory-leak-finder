import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, MCP, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await MCP.removeAllServers()
  await MCP.addServer({
    serverName: 'my-advanced-mcp-server',
  })
  await Editor.closeAll()
}

export const run = async ({ Extensions, SideBar }: TestContext): Promise<void> => {
  await SideBar.hide()
  await Extensions.show()
  await Extensions.search('')
  await Extensions.shouldHaveMcpItem({ name: 'my-advanced-mcp-server' })
}
