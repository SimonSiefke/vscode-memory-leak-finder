import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: '',
      name: 'file.ipynb',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.ipynb')
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.open('file.ipynb')
  await Editor.closeAll()
}
