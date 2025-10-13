import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test help commands (these often trigger telemetry)
  await QuickPick.showCommands()
  await QuickPick.type('help')

  const helpCommands = await QuickPick.getVisibleCommands()
  const hasHelpCommands = helpCommands.some((cmd) => cmd.toLowerCase().includes('help'))

  if (hasHelpCommands) {
    try {
      await QuickPick.select('Help: Show All Commands')
      await QuickPick.close()
    } catch (error) {
      // Help commands might not be available, continue
    }
  }

  await QuickPick.close()
}
