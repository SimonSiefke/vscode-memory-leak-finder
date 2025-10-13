import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, CommandPalette }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await CommandPalette.close()
}

export const run = async ({ CommandPalette, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for MCP-related commands
  await CommandPalette.open()
  await CommandPalette.type('mcp')

  // Look for MCP commands (these affect shared-process)
  const mcpCommands = await CommandPalette.getVisibleCommands()
  const hasMcpCommands = mcpCommands.some(
    (cmd) => cmd.toLowerCase().includes('mcp') || cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('context'),
  )

  if (hasMcpCommands) {
    try {
      // Try to access MCP management
      await CommandPalette.select('MCP: Manage Servers')
      await CommandPalette.close()
    } catch (error) {
      // MCP commands might not be available, continue
    }
  }

  // Search for AI-related commands
  await CommandPalette.type('ai')
  const aiCommands = await CommandPalette.getVisibleCommands()
  const hasAiCommands = aiCommands.some(
    (cmd) => cmd.toLowerCase().includes('ai') || cmd.toLowerCase().includes('chat') || cmd.toLowerCase().includes('copilot'),
  )

  if (hasAiCommands) {
    try {
      await CommandPalette.select('Chat: New Chat')
      await CommandPalette.close()
    } catch (error) {
      // AI commands might not be available, continue
    }
  }

  // Search for chat commands
  await CommandPalette.type('chat')
  const chatCommands = await CommandPalette.getVisibleCommands()
  const hasChatCommands = chatCommands.some((cmd) => cmd.toLowerCase().includes('chat') || cmd.toLowerCase().includes('conversation'))

  if (hasChatCommands) {
    try {
      await CommandPalette.select('Chat: New Chat')
      await CommandPalette.close()
    } catch (error) {
      // Chat commands might not be available, continue
    }
  }

  // Search for model-related commands
  await CommandPalette.type('model')
  const modelCommands = await CommandPalette.getVisibleCommands()
  const hasModelCommands = modelCommands.some((cmd) => cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('llm'))

  if (hasModelCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Model commands might not be available, continue
    }
  }

  // Search for context-related commands
  await CommandPalette.type('context')
  const contextCommands = await CommandPalette.getVisibleCommands()
  const hasContextCommands = contextCommands.some((cmd) => cmd.toLowerCase().includes('context') || cmd.toLowerCase().includes('prompt'))

  if (hasContextCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Context commands might not be available, continue
    }
  }

  // Close command palette
  await CommandPalette.close()

  // Reopen command palette to verify state
  await CommandPalette.open()
  await CommandPalette.type('help')
  await CommandPalette.close()
}

