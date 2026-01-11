import type { TestContext } from '../types.ts'

export const skip = true

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
    {
      content: '',
      name: 'file-4.txt',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-1.txt')
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.copy('file-1.txt')

  await Explorer.paste()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-1 copy.txt')
  await Explorer.delete('file-1 copy.txt')
  await Explorer.refresh()
  await Explorer.shouldHaveFocusedItem('file-1.txt')
}
