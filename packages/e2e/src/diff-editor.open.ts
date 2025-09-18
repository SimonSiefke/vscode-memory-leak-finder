import type { TestContext } from '../types.js'

export const skip = true

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

export const run = async ({ Editor, DiffEditor }: TestContext): Promise<void> => {
  await DiffEditor.open('a.txt', 'b.txt')
  await DiffEditor.expectOriginal('a')
  await DiffEditor.expectModified('b')
  await Editor.close()
}
