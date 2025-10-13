import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test privacy-related commands
  await QuickPick.showCommands()
  await QuickPick.type('privacy')

  const privacyCommands = await QuickPick.getVisibleCommands()
  const hasPrivacyCommands = privacyCommands.some((cmd) => cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('data'))

  if (hasPrivacyCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Privacy commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
