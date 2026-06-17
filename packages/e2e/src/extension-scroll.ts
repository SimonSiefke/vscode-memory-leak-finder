import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search(`@builtin`)
  await Extensions.first.shouldBe('.ipynb Support')
}

export const run = async ({ Extensions }: TestContext): Promise<void> => {
  // @ts-ignore
  await Extensions.scrollDown()
  // @ts-ignore
  await Extensions.scrollUp()
}
