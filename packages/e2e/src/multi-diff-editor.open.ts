import type { TestContext } from '../types.ts'

export const skip = 1

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
    {
      name: 'c.txt',
      content: 'c',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.shouldHaveItem('c.txt')
}

export const run = async ({ DiffEditor, Editor }: TestContext): Promise<void> => {
  await DiffEditor.open('a.txt', 'b.txt')
  await DiffEditor.expectOriginal('a')
  await DiffEditor.expectModified('b')
  await Editor.closeAll()
}
