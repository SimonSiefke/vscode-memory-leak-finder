import type { TestContext } from '../types.js'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ Output }: TestContext): Promise<void> => {
  await Output.show()
  await Output.hide()
}
