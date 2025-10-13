import type { TestContext } from '../types.ts'

export const skip = 1

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

  // Step 4: Look for "MCP: Add Server" command
  const addServerCommand = mcpCommands.find((cmd) => cmd.toLowerCase().includes('add server') || cmd.toLowerCase().includes('mcp: add'))

  if (!addServerCommand) {
    throw new Error('MCP: Add Server command not found')
  }

  // Step 5: Select the "MCP: Add Server" command
  // This might open another input field, so we'll use select with stayVisible
  await QuickPick.select(addServerCommand, true)

  // Step 6: Wait for the MCP server configuration dialog/input
  // The quick pick should still be visible with a new input field

  // Let's see what's available in the current input
  const currentCommands = await QuickPick.getVisibleCommands()

  // Step 7: Select HTTP option for our mock server
  const httpOption = currentCommands.find((cmd) => cmd.toLowerCase().includes('http') && cmd.toLowerCase().includes('server-sent events'))

  if (!httpOption) {
    throw new Error('HTTP option not found in MCP server configuration')
  }

  await QuickPick.select(httpOption, true)

  // Step 8: Now we should be able to enter the server URL
  // Let's see what's available after selecting HTTP
  const urlCommands = await QuickPick.getVisibleCommands()
  console.log('Commands after selecting HTTP:', urlCommands)

  // Step 9: Type the mock server URL
  const serverUrl = Server.getUrl()
  await QuickPick.type(serverUrl)
  console.log(`Typed mock server URL: ${serverUrl}`)

  // Step 10: Press Enter to confirm the server URL
  await QuickPick.pressEnter()
  console.log('Pressed Enter to confirm server URL')

  // Step 11: Wait for the next step or completion
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const serverName = await QuickPick.getInputValue()
  console.log(`Generated server name: ${serverName}`)
  // Step 14: Accept the generated server name
  await QuickPick.pressEnter()
  console.log('Accepted generated server name')

  // Step 15: Wait for the next step or completion
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Step 17: Wait for any final connection attempts to our mock server
  console.log('Waiting for potential MCP server connection attempts...')
  await new Promise((resolve) => setTimeout(resolve, 500000))
  console.log('MCP server configuration process finished')
}

// Cleanup function to stop the mock server
export const cleanup = async ({ Server }: TestContext): Promise<void> => {
  await Server.stop()
}
