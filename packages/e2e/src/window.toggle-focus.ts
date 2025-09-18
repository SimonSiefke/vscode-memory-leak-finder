import type { TestContext } from '../types.js'

export const skip = true

export const run = async ({  Window  }: TestContext): Promise<void> => {
  await Window.focus()
  await Window.blur()
}
