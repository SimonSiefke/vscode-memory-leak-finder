import type { TestContext } from '../types.js'

export const setup = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({ KeyBindingsEditor, Editor }: TestContext): Promise<void> => {
  await KeyBindingsEditor.show()
  await Editor.closeAll()
}
