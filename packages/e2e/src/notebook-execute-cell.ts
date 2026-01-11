import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, Explorer, Workspace, SideBar, Notebook, Extensions }: TestContext): Promise<void> => {
  await Extensions.install({
    id: 'ms-toolsai.jupyter',
    name: 'Jupyter',
  })
  await Extensions.install({
    id: 'ms-python.python',
    name: 'Python',
  })
  const notebook = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['print("Hello, World!")'],
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
  await Notebook.executeCell({ index: 0, kernelSource: 'Python Environments...', expectedOutput: 'Hello, World!\n' })
}

export const run = async ({ Notebook }: TestContext): Promise<void> => {
  // @ts-ignore
  await Notebook.executeCell({ index: 0, expectedOutput: 'Hello, World!\n' })
  await new Promise((r) => {})
}
