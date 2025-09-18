import type { TestContext } from '../types.js'

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
}
