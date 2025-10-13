import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, CommandPalette }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Ensure we start with a clean state
  await CommandPalette.close()
}

export const run = async ({ CommandPalette, Editor }: TestContext): Promise<void> => {
  // Open command palette and search for profile-related commands
  await CommandPalette.open()
  await CommandPalette.type('profile')
  
  // Look for profile commands (these affect shared-process user data)
  const profileCommands = await CommandPalette.getVisibleCommands()
  const hasProfileCommands = profileCommands.some(cmd => 
    cmd.toLowerCase().includes('profile')
  )
  
  if (hasProfileCommands) {
    // Try to access profile management (affects shared-process)
    try {
      await CommandPalette.select('Profiles: Show All Profiles')
      // If profile view opens, close it
      await CommandPalette.close()
    } catch (error) {
      // Profile commands might not be available, continue
    }
  }
  
  // Search for other user data related commands
  await CommandPalette.type('settings')
  const settingsCommands = await CommandPalette.getVisibleCommands()
  const hasSettingsCommands = settingsCommands.some(cmd => 
    cmd.toLowerCase().includes('settings')
  )
  
  if (hasSettingsCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Settings might not be available, continue
    }
  }
  
  // Search for sync-related commands
  await CommandPalette.type('sync')
  const syncCommands = await CommandPalette.getVisibleCommands()
  const hasSyncCommands = syncCommands.some(cmd => 
    cmd.toLowerCase().includes('sync')
  )
  
  if (hasSyncCommands) {
    try {
      await CommandPalette.select('Preferences: Open Settings')
      await CommandPalette.close()
    } catch (error) {
      // Sync commands might not be available, continue
    }
  }
  
  // Search for workspace commands
  await CommandPalette.type('workspace')
  const workspaceCommands = await CommandPalette.getVisibleCommands()
  const hasWorkspaceCommands = workspaceCommands.some(cmd => 
    cmd.toLowerCase().includes('workspace')
  )
  
  if (hasWorkspaceCommands) {
    try {
      await CommandPalette.select('File: Open Workspace')
      await CommandPalette.close()
    } catch (error) {
      // Workspace commands might not be available, continue
    }
  }
  
  // Close command palette
  await CommandPalette.close()
  
  // Reopen command palette to verify state
  await CommandPalette.open()
  await CommandPalette.type('help')
  await CommandPalette.close()
}

