import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'text content',
      name: 'folder/readme.txt',
    },
    {
      content: 'other content',
      name: 'other-file.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('folder')
}

export const run = async ({  Explorer, Notification }: TestContext): Promise<void> => {
  await Explorer.focus()
    // @ts-ignore
  await ImagesPreview.open('folder')
  await Notification.shouldHaveItem('No images are found in this folder')
  await Notification.closeAll()
}
