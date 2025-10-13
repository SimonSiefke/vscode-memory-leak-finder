import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Server }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Start mock MCP server using the Server page object (port 0 = OS assigns available port)
  await Server.start({ port: 0, path: '/mcp' })
}

export const run = async ({ QuickPick, Server }: TestContext): Promise<void> => {
  // Step 1: Open quick pick
  await QuickPick.showCommands()

  // Step 2: Type "mcp" to find MCP commands
  await QuickPick.type('mcp')

  // Step 3: Get available MCP commands
  const mcpCommands = await QuickPick.getVisibleCommands()
  console.log('Available MCP commands:', mcpCommands)

  // Step 4: Look for "MCP: Add Server" command
  const addServerCommand = mcpCommands.find(cmd =>
    cmd.toLowerCase().includes('add server') ||
    cmd.toLowerCase().includes('mcp: add')
  )

  if (!addServerCommand) {
    throw new Error('MCP: Add Server command not found')
  }

  // Step 5: Select the "MCP: Add Server" command
  // This might open another input field, so we'll use select with stayVisible
  await QuickPick.select(addServerCommand, true)

  // Step 6: Wait for the MCP server configuration dialog/input
  // The quick pick should still be visible with a new input field
  console.log('Successfully selected MCP: Add Server command')

  // Let's see what's available in the current input
  const currentCommands = await QuickPick.getVisibleCommands()
  console.log('Commands after selecting Add Server:', currentCommands)

  // Step 7: Select HTTP option for our mock server
  const httpOption = currentCommands.find(cmd =>
    cmd.toLowerCase().includes('http') && cmd.toLowerCase().includes('server-sent events')
  )

  if (!httpOption) {
    throw new Error('HTTP option not found in MCP server configuration')
  }

  await QuickPick.select(httpOption, true)
  console.log('Selected HTTP option for MCP server')

  // Step 8: Now we should be able to enter the server URL
  // Let's see what's available after selecting HTTP
  const urlCommands = await QuickPick.getVisibleCommands()
  console.log('Commands after selecting HTTP:', urlCommands)

  // Step 9: Type the mock server URL
  const serverUrl = Server.getUrl()
  await QuickPick.type(serverUrl)
  console.log(`Typed mock server URL: ${serverUrl}`)

  // Step 10: Press Enter to confirm the server URL
  // This should trigger VS Code to try to connect to our mock server
  await QuickPick.pressEnter()
  console.log('Pressed Enter to confirm server URL')

  // Step 11: Wait a moment for the connection attempt
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Step 12: Check if the server was added successfully
  // We could look for success messages or check the MCP server list
  console.log('MCP server configuration completed')

  // Step 13: Close any remaining dialogs
  await QuickPick.close()
}

// Cleanup function to stop the mock server
export const cleanup = async ({ Server }: TestContext): Promise<void> => {
  await Server.stop()
}
