import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test network-related commands
  await QuickPick.showCommands()
  await QuickPick.type('network')

  const networkCommands = await QuickPick.getVisibleCommands()
  const hasNetworkCommands = networkCommands.some(
    (cmd) => cmd.toLowerCase().includes('network') || cmd.toLowerCase().includes('connection'),
  )

  if (hasNetworkCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Network commands might not be available, continue
    }
  }

  await QuickPick.close()
}
