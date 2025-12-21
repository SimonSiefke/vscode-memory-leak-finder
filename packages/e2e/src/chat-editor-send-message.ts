import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = true

<<<<<<< HEAD
export const setup = async ({ Editor, ChatEditor, Electron }: TestContext): Promise<void> => {
=======
export const setup = async ({ ChatEditor, Editor, Electron }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await ChatEditor.open()
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  // TODO send message and clear it
  await ChatEditor.sendMessage('test')
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
