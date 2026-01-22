import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Workspace, ChatEditor, Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await ChatEditor.open()
  await Workspace.setFiles([
    {
      name: 'image.svg',
      content: `<xml><circle r="200"></circle></xml>`,
    },
  ])
  // TODO create an svg file, attach it as image
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `what's displayed in this image`,
    image: 'image.svg',
  })
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
