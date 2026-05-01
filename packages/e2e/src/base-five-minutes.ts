import type { TestContext } from '../types.ts'

export const skip = true

export const requiresNetwork = 1

export const setup = async ({ Workbench }: TestContext): Promise<void> => {
  await Workbench.shouldBeVisible()
}

export const run = async ({ Timeout }: TestContext): Promise<void> => {
  await Timeout.waitMinutes(5)
}
