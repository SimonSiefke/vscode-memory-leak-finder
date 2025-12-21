import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test workspace-related commands
  await QuickPick.showCommands()
  await QuickPick.type('workspace')

  const workspaceCommands = await QuickPick.getVisibleCommands()
  const hasWorkspaceCommands = workspaceCommands.some((cmd) => cmd.toLowerCase().includes('workspace'))

  if (hasWorkspaceCommands) {
    await QuickPick.select('File: Open Workspace')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
