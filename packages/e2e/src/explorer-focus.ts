import type { TestContext } from '../types.ts'

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
}
