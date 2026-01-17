import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = 1

export const setup = async ({ Editor, Explorer, Extensions, Notebook, SideBar, Workspace }: TestContext): Promise<void> => {
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
  await Explorer.refresh()
  await Explorer.shouldHaveItem('.venv')
  await SideBar.hide()
  await Editor.open('test.ipynb')
  // @ts-ignore
  await Notebook.executeCell({ expectedOutput: 'Hello, World!\n', index: 0, kernelSource: 'Python Environments...' })
}

export const run = async ({ Notebook }: TestContext): Promise<void> => {
  // @ts-ignore
  await Notebook.clearAllOutputs()
  // @ts-ignore
  await Notebook.executeCell({ expectedOutput: 'Hello, World!\n', index: 0 })
}
