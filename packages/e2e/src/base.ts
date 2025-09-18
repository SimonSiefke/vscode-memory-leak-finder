import type { TestContext } from '../types.js'

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.shouldBeVisible()
}
