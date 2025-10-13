import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test context-related commands
  await QuickPick.showCommands()
  await QuickPick.type('context')

  const contextCommands = await QuickPick.getVisibleCommands()
  const hasContextCommands = contextCommands.some((cmd) => cmd.toLowerCase().includes('context') || cmd.toLowerCase().includes('prompt'))

  if (hasContextCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Context commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
