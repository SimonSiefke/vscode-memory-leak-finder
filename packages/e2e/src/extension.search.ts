import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Extensions, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ Extensions }: TestContext): Promise<void> => {
  await Extensions.search('@builtin css')
  await Extensions.first.shouldBe('CSS Language Basics')
  await Extensions.search('@builtin html')
  await Extensions.first.shouldBe('HTML Language Basics')
}
