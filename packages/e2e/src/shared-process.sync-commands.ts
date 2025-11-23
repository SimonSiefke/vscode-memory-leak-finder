import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test sync-related commands
  await QuickPick.showCommands()
  await QuickPick.type('sync')

  const syncCommands = await QuickPick.getVisibleCommands()
  const hasSyncCommands = syncCommands.some((cmd) => cmd.toLowerCase().includes('sync'))

  if (hasSyncCommands) {
    await QuickPick.select('Preferences: Open Settings')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
