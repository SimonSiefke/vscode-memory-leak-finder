import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, ChatEditor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // TODO send message and clear it
  await ChatEditor.sendMessage({ message: `what's 1 + 1? Respond with just the number.`, expectedResponse: '2' })
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
