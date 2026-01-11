import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '',
      name: 'file.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.txt')
  await Editor.open('file.txt')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.pin()
  await Editor.unpin()
}
