import type { TestContext } from '../types.js'

export const setup = async ({ Workspace, Editor, Explorer }: TestContext): Promise<void> => {
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
}

export const run = async ({ Explorer, SideBar }: TestContext): Promise<void> => {
  await Explorer.focus()
  await SideBar.hide()
}
