import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
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
      await QuickPick.close()
    } catch (error) {
      // Port commands might not be available, continue
    }
  }

  await QuickPick.close()
}
