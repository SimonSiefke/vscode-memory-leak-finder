import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
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
      await QuickPick.close()
    } catch (error) {
      // AI commands might not be available, continue
    }
  }

  await QuickPick.close()
}
