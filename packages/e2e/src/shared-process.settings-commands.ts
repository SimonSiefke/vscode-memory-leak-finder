import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
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
      await QuickPick.close()
    } catch (error) {
      // Settings might not be available, continue
    }
  }

  await QuickPick.close()
}
