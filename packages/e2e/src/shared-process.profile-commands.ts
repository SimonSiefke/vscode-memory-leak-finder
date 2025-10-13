import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test profile-related commands
  await QuickPick.showCommands()
  await QuickPick.type('profile')

  const profileCommands = await QuickPick.getVisibleCommands()
  const hasProfileCommands = profileCommands.some((cmd) => cmd.toLowerCase().includes('profile'))

  if (hasProfileCommands) {
    try {
      await QuickPick.select('Profiles: Show All Profiles')
      await QuickPick.close()
    } catch (error) {
      // Profile commands might not be available, continue
    }
  }

  await QuickPick.close()
}
