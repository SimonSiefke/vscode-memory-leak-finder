import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await QuickPick.close()
}

export const run = async ({ QuickPick, Editor }: TestContext): Promise<void> => {
  // Test usage data commands
  await QuickPick.showCommands()
  await QuickPick.type('usage')

  const usageCommands = await QuickPick.getVisibleCommands()
  const hasUsageCommands = usageCommands.some((cmd) => cmd.toLowerCase().includes('usage') || cmd.toLowerCase().includes('analytics'))

  if (hasUsageCommands) {
    try {
      await QuickPick.select('Preferences: Open Settings')
      await QuickPick.close()
    } catch (error) {
      // Usage commands might not be available, continue
    }
  }

  await QuickPick.close()
}
