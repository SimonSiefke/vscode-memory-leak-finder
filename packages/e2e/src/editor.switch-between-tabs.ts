import type { TestContext } from '../types.ts'

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
  await Editor.open('a.txt')
  await Editor.open('b.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.switchToTab('a.txt')
  await Editor.shouldHaveText('a')
  await Editor.switchToTab('b.txt')
  await Editor.shouldHaveText('b')
}
