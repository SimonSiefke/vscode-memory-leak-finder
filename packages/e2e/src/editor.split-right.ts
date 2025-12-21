import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: 'sample text',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.txt')
  await Editor.splitRight()
  await Editor.closeAll()
}
