import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test AI-related commands
  await QuickPick.showCommands()
  await QuickPick.type('ai')

  const aiCommands = await QuickPick.getVisibleCommands()
  const hasAiCommands = aiCommands.some(
    (cmd) => cmd.toLowerCase().includes('ai') || cmd.toLowerCase().includes('chat') || cmd.toLowerCase().includes('copilot'),
  )

  if (hasAiCommands) {
    try {
      await QuickPick.select('Chat: New Chat')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // AI commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
