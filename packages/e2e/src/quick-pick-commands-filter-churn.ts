import type { TestContext } from '../types.ts'

export const skip = 1

const queries = ['open', 'settings', 'chat', 'theme']

export const run = async ({ QuickPick }: TestContext): Promise<void> => {
  for (const query of queries) {
    await QuickPick.showCommands()
    await QuickPick.type(query)
    const visibleCommands = await QuickPick.getVisibleCommands()
    if (visibleCommands.length === 0) {
      throw new Error(`Expected commands for query ${query}`)
    }
    const focusedItem = await QuickPick.getFocusedItemLabel()
    if (!focusedItem) {
      throw new Error(`Expected focused command for query ${query}`)
    }
    await QuickPick.focusNext()
    await QuickPick.focusPrevious()
    await QuickPick.hide()
  }
}
