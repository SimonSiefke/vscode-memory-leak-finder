import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Workspace, Explorer  }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file-1.txt',
      content: '',
    },
    {
      name: 'file-2.txt',
      content: '',
    },
    {
      name: 'file-3.txt',
      content: '',
    },
    {
      name: 'file-4.txt',
      content: '',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-1.txt')
}

export const run = async ({  Explorer  }: TestContext): Promise<void> => {
  await Explorer.copy('file-1.txt')
  await Explorer.paste()
  await Explorer.shouldHaveFocusedItem('file-1 copy.txt')
  await Explorer.delete('file-1 copy.txt')
  await Explorer.shouldHaveFocusedItem('file-1.txt')
}
