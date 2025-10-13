import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for MCP-related commands
  await QuickPick.showCommands()
  await QuickPick.type('mcp')

  // Look for MCP commands (these affect shared-process)
  const mcpCommands = await QuickPick.getVisibleCommands()
  const hasMcpCommands = mcpCommands.some(
    (cmd) => cmd.toLowerCase().includes('mcp') || cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('context'),
  )

  if (hasMcpCommands) {
    try {
      // Try to access MCP management
      await QuickPick.select('MCP: Manage Servers')
      await QuickPick.close()
    } catch (error) {
      // MCP commands might not be available, continue
    }
  }

  // Search for AI-related commands
  await QuickPick.showCommands()
  await QuickPick.type('ai')
  const aiCommands = await QuickPick.getVisibleCommands()
  const hasAiCommands = aiCommands.some(
    (cmd) => cmd.toLowerCase().includes('ai') || cmd.toLowerCase().includes('chat') || cmd.toLowerCase().includes('copilot'),
  )

  if (hasAiCommands) {
    try {
      await QuickPick.select('Chat: New Chat')
      await QuickPick.close()
    } catch (error) {
      // AI commands might not be available, continue
    }
  }

  // Search for chat commands
  await QuickPick.showCommands()
  await QuickPick.type('chat')
  const chatCommands = await QuickPick.getVisibleCommands()
  const hasChatCommands = chatCommands.some((cmd) => cmd.toLowerCase().includes('chat') || cmd.toLowerCase().includes('conversation'))

  if (hasChatCommands) {
    try {
      await QuickPick.select('Chat: New Chat')
      await QuickPick.close()
    } catch (error) {
      // Chat commands might not be available, continue
    }
  }

  // Search for model-related commands
  await QuickPick.showCommands()
  await QuickPick.type('model')
  const modelCommands = await QuickPick.getVisibleCommands()
  const hasModelCommands = modelCommands.some((cmd) => cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('llm'))

  if (hasModelCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Model commands might not be available, continue
    }
  }

  // Search for context-related commands
  await QuickPick.showCommands()
  await QuickPick.type('context')
  const contextCommands = await QuickPick.getVisibleCommands()
  const hasContextCommands = contextCommands.some((cmd) => cmd.toLowerCase().includes('context') || cmd.toLowerCase().includes('prompt'))

  if (hasContextCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Context commands might not be available, continue
    }
  }

  // Close command palette
  await QuickPick.close()

  // Reopen command palette to verify state
  await QuickPick.showCommands()
  await QuickPick.type('help')
  await QuickPick.close()
}
