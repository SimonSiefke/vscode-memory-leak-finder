import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, ChatEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  // TODO send message and clear it
  await ChatEditor.sendMessage('test')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
