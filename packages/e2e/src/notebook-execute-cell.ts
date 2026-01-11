import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Explorer, Workspace, SideBar, Notebook }: TestContext): Promise<void> => {
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
  await Explorer.refresh()
  await Explorer.shouldHaveItem('test.ipynb')
  // @ts-ignore
  await Notebook.createVenv()
  await Explorer.shouldHaveItem('.venv')
  await SideBar.hide()
  await Editor.open('test.ipynb')
  // @ts-ignore
  await Notebook.executeCell({ index: 0, kernelSource: 'Python Environments...' })
}

export const run = async ({ Notebook }: TestContext): Promise<void> => {
  await Notebook.executeCell({ index: 0 })
  await new Promise((r) => {
    setTimeout(r, 100000)
  })
  await Notebook.executeCell({ index: 1 })
  await Notebook.executeCell({ index: 2 })
}
