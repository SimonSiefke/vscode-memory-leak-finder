import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test context-related commands
  await QuickPick.showCommands()
  await QuickPick.type('context')

  const contextCommands = await QuickPick.getVisibleCommands()
  const hasContextCommands = contextCommands.some((cmd) => cmd.toLowerCase().includes('context') || cmd.toLowerCase().includes('prompt'))

  if (hasContextCommands) {
    await QuickPick.select('Preferences: Open Settings')
  } else {
    // Only close if no command was selected
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
