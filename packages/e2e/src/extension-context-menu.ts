import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Extensions }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({ ContextMenu, Extensions }: TestContext): Promise<void> => {
  await Extensions.first.openContextMenu()
  await ContextMenu.close()
}
