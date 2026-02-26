import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = 1

export const run = async ({ ProcessExplorer }: TestContext): Promise<void> => {
  await ProcessExplorer.show()
  await ProcessExplorer.hide()
}
