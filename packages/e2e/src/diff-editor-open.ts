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
  // @ts-ignore
  await DiffEditor.open({
    file1: 'a.txt',
    file2: 'b.txt',
    file1Content: 'a',
    file2Content: 'b',
  })
  await Editor.close()
}
