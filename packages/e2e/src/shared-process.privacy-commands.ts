import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test privacy-related commands
  await QuickPick.showCommands()
  await QuickPick.type('privacy')

  const privacyCommands = await QuickPick.getVisibleCommands()
  const hasPrivacyCommands = privacyCommands.some((cmd) => cmd.toLowerCase().includes('privacy') || cmd.toLowerCase().includes('data'))

  if (hasPrivacyCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Privacy commands might not be available, continue
    }
  }

  await QuickPick.close()
}
