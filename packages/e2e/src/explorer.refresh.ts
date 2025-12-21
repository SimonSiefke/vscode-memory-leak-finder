import type { TestContext } from '../types.ts'

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
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
  await Explorer.focus()
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.add({
    content: '',
    name: 'file-4.txt',
  })
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-4.txt')
  await Workspace.remove('file-4.txt')
  await Explorer.refresh()
  await Explorer.not.toHaveItem('file-4.txt')
}
