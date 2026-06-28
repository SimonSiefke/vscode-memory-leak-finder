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

export const run = async ({ ContextMenu, Explorer, Notification }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Explorer.openContextMenu('folder')
  await ContextMenu.select('Open in Images Preview')
  await Notification.shouldHaveItem('No images are found in this folder')
  await Notification.closeAll()
}
