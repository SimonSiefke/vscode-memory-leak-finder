import type { TestContext } from '../types.ts'

export const run = async ({ DebugConsole }: TestContext): Promise<void> => {
  await DebugConsole.show()
  await DebugConsole.hide()
}
