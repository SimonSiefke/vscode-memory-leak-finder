import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Extensions }: TestContext): Promise<void> => {
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions }: TestContext): Promise<void> => {
  await Extensions.openSuggest()
  await Extensions.closeSuggest()
}
