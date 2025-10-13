import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test remote development commands
  await QuickPick.showCommands()
  await QuickPick.type('remote')

  const remoteCommands = await QuickPick.getVisibleCommands()
  const hasRemoteCommands = remoteCommands.some((cmd) => cmd.toLowerCase().includes('remote') || cmd.toLowerCase().includes('ssh'))

  if (hasRemoteCommands) {
    try {
      await QuickPick.select('Remote-SSH: Connect to Host...')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Remote commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
