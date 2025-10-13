import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
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
      await QuickPick.close()
    } catch (error) {
      // MCP commands might not be available, continue
    }
  }

  await QuickPick.close()
}
