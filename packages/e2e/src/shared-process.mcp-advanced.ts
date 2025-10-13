import type { TestContext } from '../types.ts'


export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  // Step 1: Launch the mock MCP server
  const serverInfo = await Server.start({ port: 0, path: '/mcp' })
  console.log(`Step 1: Launched mock MCP server at ${serverInfo.url}`)

  // Step 2: Add the MCP server using QuickPick
  const serverName = 'my-advanced-mcp-server'
  await MCP.addServer({
    serverUrl: serverInfo.url,
    serverName
  })
  console.log(`Step 2: Added MCP server "${serverName}"`)

  // Step 3: Remove the added MCP server
  await MCP.removeServer(serverName)
  console.log(`Step 3: Removed MCP server "${serverName}"`)

  // Step 4: Close the mock MCP server
  await Server.stop()
  console.log('Step 4: Closed mock MCP server')
}
