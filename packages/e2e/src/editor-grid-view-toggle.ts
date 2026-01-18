import type { TestContext } from '../types.js'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAllEditorGroups()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.enable2x2GridView()

  await Editor.closeAllEditorGroups()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAllEditorGroups()
}
