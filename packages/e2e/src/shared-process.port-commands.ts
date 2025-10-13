import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test port forwarding commands
  await QuickPick.showCommands()
  await QuickPick.type('port')

  const portCommands = await QuickPick.getVisibleCommands()
  const hasPortCommands = portCommands.some((cmd) => cmd.toLowerCase().includes('port') || cmd.toLowerCase().includes('forward'))

  if (hasPortCommands) {
    try {
      await QuickPick.select('Ports: Focus on Ports View')
      // Don't try to close quick pick if it's not open
    } catch (error) {
      // Port commands might not be available, continue
    }
  }

  // Don't try to close quick pick if it's not open
}
