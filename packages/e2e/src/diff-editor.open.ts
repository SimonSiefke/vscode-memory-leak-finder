import type { TestContext } from '../types.ts'

export const skip = true

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
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
}

export const run = async ({ DiffEditor, Editor }: TestContext): Promise<void> => {
  await DiffEditor.open('a.txt', 'b.txt')
  await DiffEditor.expectOriginal('a')
  await DiffEditor.expectModified('b')
  await Editor.close()
}
