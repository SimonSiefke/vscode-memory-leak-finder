import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      name: 'file.ipynb',
      content: '',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.ipynb')
  await Editor.open('file.ipynb')
}

export const run = async ({ Notebook }: TestContext): Promise<void> => {
  await Notebook.addMarkdownCell()
  await Notebook.removeMarkdownCell()
}
