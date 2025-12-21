import type { TestContext } from '../types.ts'

export const skip = process.platform === 'darwin'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'a',
      name: 'a.txt',
    },
    {
      content: 'b',
      name: 'b.txt',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ ContextMenu, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.focus()
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
}
