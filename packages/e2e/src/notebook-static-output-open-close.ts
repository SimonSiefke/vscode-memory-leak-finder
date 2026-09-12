import type { TestContext } from '../types.ts'

export const skip = 1

const cells = Array.from({ length: 20 }, (_, index) => ({
  cell_type: 'markdown',
  metadata: {},
  source: [`## Section ${index + 1}\n`, `Notebook lifecycle content ${index + 1}`],
}))

const notebook = {
  cells: [
    {
      cell_type: 'code',
      execution_count: 1,
      metadata: {},
      outputs: [
        {
          name: 'stdout',
          output_type: 'stream',
          text: ['static notebook output\n'],
        },
      ],
      source: ['print("static notebook output")'],
    },
    ...cells,
  ],
  metadata: {
    language_info: {
      name: 'python',
    },
  },
  nbformat: 4,
  nbformat_minor: 2,
}

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: JSON.stringify(notebook, null, 2) + '\n',
      name: 'static-output.ipynb',
    },
  ])
  await Workspace.updateWorkspaceSettings({
    'workbench.editorAssociations': {
      '*.ipynb': 'jupyter-notebook',
    },
  })
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('static-output.ipynb')
}

export const run = async ({ Editor, Explorer, Notebook }: TestContext): Promise<void> => {
  try {
    await Explorer.openItem('static-output.ipynb')
    await Notebook.shouldHaveOutput('static notebook output\n')
    await Notebook.scrollDown()
    await Notebook.scrollUp()
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.updateWorkspaceSettings({ 'workbench.editorAssociations': undefined })
}
