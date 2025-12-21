import type { TestContext } from '../types.ts'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  // Don't try to close quick pick if it's not open
}

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  // Test usage data commands
  await QuickPick.showCommands()
  await QuickPick.type('usage')

  const usageCommands = await QuickPick.getVisibleCommands()
  const hasUsageCommands = usageCommands.some((cmd) => cmd.toLowerCase().includes('usage') || cmd.toLowerCase().includes('analytics'))

  if (hasUsageCommands) {
    await QuickPick.select('Preferences: Open Settings')
    await QuickPick.close()
  }

  // Don't try to close quick pick if it's not open
}
