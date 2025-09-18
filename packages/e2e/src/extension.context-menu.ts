import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Extensions, Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Extensions.show()
  await Extensions.search('@builtin html ')
  await Extensions.first.shouldBe('HTML Language Basics')
}

export const run = async ({  Extensions, ContextMenu  }: TestContext): Promise<void> => {
  await Extensions.first.openContextMenu()
  await ContextMenu.close()
}
