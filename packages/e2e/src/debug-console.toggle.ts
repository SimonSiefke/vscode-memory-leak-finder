import type { TestContext } from '../types.js'

export const run = async ({ DebugConsole }: TestContext): Promise<void> => {
  await DebugConsole.show()
  await DebugConsole.hide()
}
