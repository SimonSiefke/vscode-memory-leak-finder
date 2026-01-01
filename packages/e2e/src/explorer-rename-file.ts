import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Workspace.setFiles([
    {
      content: '',
      name: 'file-1.txt',
    },
    {
      content: '',
      name: 'file-2.txt',
    },
    {
      content: '',
      name: 'file-3.txt',
    },
  ])
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-1.txt')
  await Explorer.shouldHaveItem('file-2.txt')
  await Explorer.shouldHaveItem('file-3.txt')
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.rename('file-2.txt', 'renamed.txt')
  await Explorer.rename('renamed.txt', 'file-2.txt')
}
