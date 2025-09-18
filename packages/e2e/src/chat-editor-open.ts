import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({  ChatEditor, Editor  }: TestContext): Promise<void> => {
  await ChatEditor.open()
  await Editor.closeAll()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
