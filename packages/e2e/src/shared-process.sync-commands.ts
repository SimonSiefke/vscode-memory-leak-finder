import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test sync-related commands
  await QuickPick.showCommands()
  await QuickPick.type('sync')

  const syncCommands = await QuickPick.getVisibleCommands()
  const hasSyncCommands = syncCommands.some((cmd) => cmd.toLowerCase().includes('sync'))

  if (hasSyncCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Sync commands might not be available, continue
    }
  }

  await QuickPick.close()
}
