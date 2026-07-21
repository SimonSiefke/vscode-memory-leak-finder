import type { TestContext } from '../types.js'

export const skip = 1

export const requiresNetwork = 1

const greenPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNg+M/wHwAEAQH/cetH5QAAAABJRU5ErkJggg==', 'base64')

export const setup = async ({ ChatEditor, Editor, SideBar, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await ChatEditor.open()
  await Workspace.setFiles([
    {
      content: greenPng,
      name: 'image.png',
    },
    {
      content: greenPng,
      name: 'image-2.png',
    },
    {
      content: greenPng,
      name: 'image-3.png',
    },
  ])
}

export const run = async ({ ChatEditor }: TestContext): Promise<void> => {
  await ChatEditor.attachImage('image.png')
  await ChatEditor.attachImage('image-2.png')
  await ChatEditor.attachImage('image-3.png')

  console.log('wait...')
  await new Promise(() => {})
  // TODO click on image to open carousel
  // TODO close carousel
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
