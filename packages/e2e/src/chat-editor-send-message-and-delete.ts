import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = true

export const setup = async ({ Editor, Electron, SideBar }: TestContext): Promise<void> => {
  await Electron.mockDialog({
    response: 1,
  })
  await Editor.closeAll()
  await SideBar.hide()
}

export const run = async ({ ChatEditor, Editor }: TestContext): Promise<void> => {
  await ChatEditor.open()
  await ChatEditor.sendMessage({ message: 'test', model: ChatEditor.Models.GPT41, verify: true })
  // TODO right click context menum then delete
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
