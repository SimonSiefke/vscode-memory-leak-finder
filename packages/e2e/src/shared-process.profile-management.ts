import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Ensure we start with a clean state
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for profile-related commands
  await QuickPick.showCommands()
  await QuickPick.type('profile')

  // Look for profile commands (these affect shared-process user data)
  const profileCommands = await QuickPick.getVisibleCommands()
  const hasProfileCommands = profileCommands.some((cmd) => cmd.toLowerCase().includes('profile'))

  if (hasProfileCommands) {
    // Try to access profile management (affects shared-process)
    try {
      await QuickPick.select('Profiles: Show All Profiles')
      // If profile view opens, close it
      await QuickPick.close()
    } catch (error) {
      // Profile commands might not be available, continue
    }
  }

  // Search for other user data related commands
  await QuickPick.showCommands()
  await QuickPick.type('settings')
  const settingsCommands = await QuickPick.getVisibleCommands()
  const hasSettingsCommands = settingsCommands.some((cmd) => cmd.toLowerCase().includes('settings'))

  if (hasSettingsCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Settings might not be available, continue
    }
  }

  // Search for sync-related commands
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

  // Search for workspace commands
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

  // Close command palette
  await QuickPick.close()

  // Reopen command palette to verify state
  await QuickPick.showCommands()
  await QuickPick.type('help')
  await QuickPick.close()
}
