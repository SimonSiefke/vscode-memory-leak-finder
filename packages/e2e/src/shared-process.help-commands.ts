import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test help commands (these often trigger telemetry)
  await QuickPick.showCommands()
  await QuickPick.type('help')

  const helpCommands = await QuickPick.getVisibleCommands()
  const hasHelpCommands = helpCommands.some((cmd) => cmd.toLowerCase().includes('help'))

  if (hasHelpCommands) {
    await QuickPick.select('Help: Show All Commands')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
