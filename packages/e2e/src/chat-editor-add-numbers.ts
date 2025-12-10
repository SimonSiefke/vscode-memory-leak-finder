import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, ChatEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({ message: `what's 1 + 1? Respond with just the number. Don't use any todo list.`, expectedResponse: '2' })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
