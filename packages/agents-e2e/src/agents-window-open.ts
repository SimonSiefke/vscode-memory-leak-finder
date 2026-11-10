import type { TestContext } from '../../e2e/types.ts'

export const run = async ({ AgentsWindow, Electron }: TestContext): Promise<void> => {
  await AgentsWindow.shouldBeVisible()
  await AgentsWindow.newChat()
  await AgentsWindow.shouldHaveNewChat()
  const windows = await Electron.getWindowCount()
  if (windows !== 1) throw new Error(`Expected only the Agents window, got ${windows} windows`)
}
