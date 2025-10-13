import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test chat-related commands
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

  await QuickPick.close()
}
