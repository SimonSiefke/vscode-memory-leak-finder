import type { TestContext } from '../types.js'

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
  await Explorer.focus()
}

export const run = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Explorer.removeCurrent()
  await Explorer.not.toHaveItem('file-1.txt')
  await Workspace.add({ content: '', name: 'file-1.txt' })
  await Explorer.refresh()
}
