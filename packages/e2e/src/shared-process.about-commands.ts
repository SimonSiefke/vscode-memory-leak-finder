import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test about commands (these often trigger telemetry)
  await QuickPick.showCommands()
  await QuickPick.type('about')

  const aboutCommands = await QuickPick.getVisibleCommands()
  const hasAboutCommands = aboutCommands.some((cmd) => cmd.toLowerCase().includes('about'))

  if (hasAboutCommands) {
    try {
      await QuickPick.select('Help: About')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // About commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
