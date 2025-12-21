import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test settings-related commands
  await QuickPick.showCommands()
  await QuickPick.type('settings')

  const settingsCommands = await QuickPick.getVisibleCommands()
  const hasSettingsCommands = settingsCommands.some((cmd) => cmd.toLowerCase().includes('settings'))

  if (hasSettingsCommands) {
    // Select the first available settings-related command
    const settingsCommand = settingsCommands.find((cmd) => cmd.toLowerCase().includes('settings'))
    if (settingsCommand) {
      await QuickPick.select(settingsCommand)
    }
  } else {
    // Only close if no command was selected
    await QuickPick.close()
  }
}
