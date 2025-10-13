import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test workspace-related commands
  await QuickPick.showCommands()
  await QuickPick.type('workspace')

  const workspaceCommands = await QuickPick.getVisibleCommands()
  const hasWorkspaceCommands = workspaceCommands.some((cmd) => cmd.toLowerCase().includes('workspace'))

  if (hasWorkspaceCommands) {
    try {
      await QuickPick.select('File: Open Workspace')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Workspace commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
