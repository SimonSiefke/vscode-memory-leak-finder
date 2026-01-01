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

export const run = async ({ DiffEditor, Editor }: TestContext): Promise<void> => {
  // @ts-ignore
  await DiffEditor.open({
    file1: 'a.txt',
    file2: 'b.txt',
    file1Content: 'a',
    file2Content: 'b',
  })
  await Editor.splitRight()
  // @ts-ignore
  await DiffEditor.open({
    file1: 'c.txt',
    file2: 'd.txt',
    file1Content: 'c',
    file2Content: 'd',
  })
  await Editor.closeAll()
}
