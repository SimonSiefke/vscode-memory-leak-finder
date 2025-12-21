import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test model-related commands
  await QuickPick.showCommands()
  await QuickPick.type('model')

  const modelCommands = await QuickPick.getVisibleCommands()
  const hasModelCommands = modelCommands.some((cmd) => cmd.toLowerCase().includes('model') || cmd.toLowerCase().includes('llm'))

  if (hasModelCommands) {
    await QuickPick.select('Preferences: Open Settings')
  } else {
    // Only close if no command was selected
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
