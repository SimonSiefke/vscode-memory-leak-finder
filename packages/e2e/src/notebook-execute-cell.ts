import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const notebook = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['print("Hello, World!")'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['x = 1 + 1', 'print(x)'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['result = 2 * 3', 'print(f"Result: {result}")'],
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
  await Notebook.executeCell(0)
  await Notebook.executeCell(1)
  await Notebook.executeCell(2)
}
