import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test port forwarding commands
  await QuickPick.showCommands()
  await QuickPick.type('port')

  const portCommands = await QuickPick.getVisibleCommands()
  const hasPortCommands = portCommands.some((cmd) => cmd.toLowerCase().includes('port') || cmd.toLowerCase().includes('forward'))

  if (hasPortCommands) {
    await QuickPick.select('Ports: Focus on Ports View')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
