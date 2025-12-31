import type { TestContext } from '../types.ts'

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
    {
      content: 'c',
      name: 'c.txt',
    },
    {
      content: 'd',
      name: 'd.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.shouldHaveItem('c.txt')
  await Explorer.shouldHaveItem('d.txt')
}

// @ts-ignore
export const run = async ({ DiffEditor, Editor, expect, page }: TestContext): Promise<void> => {
  await DiffEditor.open('a.txt', 'b.txt')
  await DiffEditor.expectOriginal('a')
  await DiffEditor.expectModified('b')
  await Editor.splitRight()
  await DiffEditor.open('c.txt', 'd.txt')
  await DiffEditor.expectOriginal('c')
  await DiffEditor.expectModified('d')
  const diffEditors = page.locator('.diff-editor')
  await expect(diffEditors).toHaveCount(2)
  await Editor.closeAll()
}
