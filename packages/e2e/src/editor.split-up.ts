import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.txt')
  await Editor.splitUp()
  await Editor.closeAll()
}
