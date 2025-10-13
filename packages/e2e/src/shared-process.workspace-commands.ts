import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
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
      await QuickPick.close()
    } catch (error) {
      // Workspace commands might not be available, continue
    }
  }

  await QuickPick.close()
}
