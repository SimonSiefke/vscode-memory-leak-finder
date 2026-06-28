import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'folder content',
      name: 'folder/file.txt',
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

export const run = async ({ ContextMenu, Explorer, Search }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Explorer.openContextMenu('folder')
  await ContextMenu.select('Find in Folder...')
  // @ts-ignore
  await Search.shouldBeVisible()
  await Explorer.focus()
}
