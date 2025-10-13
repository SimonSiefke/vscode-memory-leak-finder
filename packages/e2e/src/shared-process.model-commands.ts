import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test model-related commands
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

  await QuickPick.close()
}
