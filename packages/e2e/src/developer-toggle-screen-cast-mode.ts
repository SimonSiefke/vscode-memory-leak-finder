import type { TestContext } from '../types.js'

export const run = async ({ Developer }: TestContext): Promise<void> => {
  await Developer.toggleScreenCastMode()
  await Developer.toggleScreenCastMode()
}
