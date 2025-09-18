import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const run = async ({ Workspace, Editor, Explorer, ContextMenu }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'a.txt',
      content: 'a',
    },
    {
      name: 'b.txt',
      content: 'b',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.focus()
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
}
