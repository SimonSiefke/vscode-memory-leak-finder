import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({  Editor, ChatEditor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({  ChatEditor, Editor  }: TestContext): Promise<void> => {
  await ChatEditor.openFinishSetup()
  await ChatEditor.closeFinishSetup()
}

export const teardown = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
