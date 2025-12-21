import type { TestContext } from '../types.ts'

export const skip = 1

<<<<<<< HEAD
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
=======
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
    {
      content: 'c',
      name: 'c.txt',
>>>>>>> origin/main
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
