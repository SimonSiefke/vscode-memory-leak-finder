import type { TestContext } from '../types.ts'

export const skip = true

export const run = async ({ Window }: TestContext): Promise<void> => {
  await Window.focus()
  await Window.blur()
}
