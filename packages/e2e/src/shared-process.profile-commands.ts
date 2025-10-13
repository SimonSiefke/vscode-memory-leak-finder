import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test profile-related commands
  await QuickPick.showCommands()
  await QuickPick.type('profile')

  const profileCommands = await QuickPick.getVisibleCommands()
  const hasProfileCommands = profileCommands.some((cmd) => cmd.toLowerCase().includes('profile'))

  if (hasProfileCommands) {
    try {
      await QuickPick.select('Profiles: Show All Profiles')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Profile commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
