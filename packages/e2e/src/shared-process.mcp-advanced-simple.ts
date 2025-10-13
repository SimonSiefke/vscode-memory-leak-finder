import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Server }: TestContext): Promise<void> => {
  await Editor.closeAll()
  
  // Start mock MCP server using the Server page object (port 0 = OS assigns available port)
  await Server.start({ port: 0, path: '/mcp' })
}

export const run = async ({ MCP, Server }: TestContext): Promise<void> => {
  // Use the MCP page object to add a server
  const serverUrl = Server.getUrl()
  const serverName = 'my-test-mcp-server'
  
  console.log(`Adding MCP server: ${serverUrl} with name: ${serverName}`)
  
  await MCP.addServer({
    serverUrl,
    serverName
  })
  
  console.log('MCP server configuration completed successfully')
}

// Cleanup function to stop the mock server
export const cleanup = async ({ Server }: TestContext): Promise<void> => {
  await Server.stop()
}
