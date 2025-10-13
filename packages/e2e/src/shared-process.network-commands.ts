import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test network-related commands
  await QuickPick.showCommands()
  await QuickPick.type('network')

  const networkCommands = await QuickPick.getVisibleCommands()
  const hasNetworkCommands = networkCommands.some(
    (cmd) => cmd.toLowerCase().includes('network') || cmd.toLowerCase().includes('connection'),
  )

  if (hasNetworkCommands) {
    await QuickPick.select('Preferences: Open Settings')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
