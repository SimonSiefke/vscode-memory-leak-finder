import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test MCP-specific commands
  await QuickPick.showCommands()
  await QuickPick.type('mcp')

  const mcpCommands = await QuickPick.getVisibleCommands()
  const hasMcpCommands = mcpCommands.some(
    (cmd) => cmd.toLowerCase().includes('mcp') || cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('context'),
  )

  if (hasMcpCommands) {
    // Select the first available MCP-related command
    const mcpCommand = mcpCommands.find(
      (cmd) => cmd.toLowerCase().includes('mcp') || cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('context'),
    )
    if (mcpCommand) {
      await QuickPick.select(mcpCommand)
    }
  } else {
    // Only close if no command was selected
    await QuickPick.close()
  }
}
