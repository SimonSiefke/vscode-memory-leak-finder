import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
}

export const run = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  await ChatEditor.open()
  await ChatEditor.sendMessage({ message: 'test', model: ChatEditor.Models.Auto })
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
