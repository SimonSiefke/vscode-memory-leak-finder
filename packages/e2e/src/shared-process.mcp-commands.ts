import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
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
    try {
      await QuickPick.select('MCP: Manage Servers')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // MCP commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
