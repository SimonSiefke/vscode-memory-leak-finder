import type { TestContext } from '../types.ts'

// Mock MCP server setup
let mockServer: any = null
const MOCK_SERVER_PORT = 3000
const MOCK_SERVER_URL = `http://localhost:${MOCK_SERVER_PORT}`

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()

  // Start mock MCP server
  try {
    const { createServer } = await import('http')
    const { URL } = await import('url')

    mockServer = createServer((req, res) => {
      const parsedUrl = new URL(req.url || '', MOCK_SERVER_URL)

      // Handle MCP protocol endpoints
      if (parsedUrl.pathname === '/mcp') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
            serverInfo: {
              name: 'mock-mcp-server',
              version: '1.0.0'
            }
          }
        }))
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Not found' }))
      }
    })

    mockServer.listen(MOCK_SERVER_PORT, () => {
      console.log(`Mock MCP server running on ${MOCK_SERVER_URL}`)
    })
  } catch (error) {
    console.log('Could not start mock server:', error)
  }
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
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
  await QuickPick.select(addServerCommand, true) // stayVisible = true

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

  await QuickPick.select(httpOption, true) // stayVisible = true
  console.log('Selected HTTP option for MCP server')

  // Step 8: Now we should be able to enter the server URL
  // Let's see what's available after selecting HTTP
  const urlCommands = await QuickPick.getVisibleCommands()
  console.log('Commands after selecting HTTP:', urlCommands)

  // Step 9: Type the mock server URL
  await QuickPick.type(MOCK_SERVER_URL)
  console.log(`Typed mock server URL: ${MOCK_SERVER_URL}`)

  // Step 10: Press Enter to confirm the server URL
  // This should trigger VS Code to try to connect to our mock server
  // We'll use the type method with a newline character to simulate Enter
  await QuickPick.type('\n')
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
export const cleanup = async (): Promise<void> => {
  if (mockServer) {
    mockServer.close()
    console.log('Mock MCP server stopped')
  }
}
