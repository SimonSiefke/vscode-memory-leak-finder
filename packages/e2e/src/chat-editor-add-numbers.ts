import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    expectedResponse: '2',
    message: `what's 1 + 1? Respond with just the number. Don't use any todo list. Don't create a todo. Under no circumstances use any tool.`,
  })
  // @ts-ignore
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
