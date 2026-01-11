import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const notebook = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['print("first line")\nprint("second line")'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['print("third line")'],
      },
    ],
    metadata: {
      language_info: {
        name: 'python',
      },
    },
    nbformat: 4,
    nbformat_minor: 2,
  }

  await Workspace.setFiles([
    {
      content: JSON.stringify(notebook, null, 2) + '\n',
      name: 'test.ipynb',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('test.ipynb')
  await Editor.open('test.ipynb')
}

export const run = async ({ Notebook }: TestContext): Promise<void> => {
  await Notebook.splitCell(0)
  await Notebook.mergeCell(0)
}
