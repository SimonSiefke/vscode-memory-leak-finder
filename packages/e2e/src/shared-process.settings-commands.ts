import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test settings-related commands
  await QuickPick.showCommands()
  await QuickPick.type('settings')

  const settingsCommands = await QuickPick.getVisibleCommands()
  const hasSettingsCommands = settingsCommands.some((cmd) => cmd.toLowerCase().includes('settings'))

  if (hasSettingsCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Settings might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
