import type { TestContext } from '../types.ts'

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.shouldBeVisible()
  await new Promise((r) => {})
}
