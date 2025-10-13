import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test about commands (these often trigger telemetry)
  await QuickPick.showCommands()
  await QuickPick.type('about')

  const aboutCommands = await QuickPick.getVisibleCommands()
  const hasAboutCommands = aboutCommands.some((cmd) => cmd.toLowerCase().includes('about'))

  if (hasAboutCommands) {
    await QuickPick.select('Help: About')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
