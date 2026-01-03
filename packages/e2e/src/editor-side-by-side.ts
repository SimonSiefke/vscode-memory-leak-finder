import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
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
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('a.txt')
  await Editor.shouldHaveText('a', 'a.txt')
  await Editor.splitDown()
  await Editor.open('b.txt')
  await Editor.shouldHaveText('b', 'b.txt')
  await Editor.closeAll()
}
