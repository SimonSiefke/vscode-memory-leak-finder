import type { TestContext } from '../types.js'

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
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
  await Editor.open('a.txt')
  await Editor.open('b.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.switchToTab('a.txt')
  await Editor.shouldHaveText('a')
  await Editor.switchToTab('b.txt')
  await Editor.shouldHaveText('b')
}
