import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="50" />
</svg>`

export const setup = async ({ Workspace, ChatEditor, Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await ChatEditor.open()
  await Workspace.setFiles([
    {
      name: 'image.svg',
      content: svg,
    },
  ])
  // TODO create an svg file, attach it as image
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.sendMessage({
    message: `what's displayed in this image`,
    image: 'image.svg',
    verify: true,
  })
  await ChatEditor.clearAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
