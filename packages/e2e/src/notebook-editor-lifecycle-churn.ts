import type { TestContext } from '../types.ts'

export const skip = 1

const notebook = {
  cells: [
    {
      cell_type: 'code',
      metadata: {},
      source: ['print("first line")\n', 'print("second line")'],
    },
    {
      cell_type: 'markdown',
      metadata: {},
      source: ['## Lifecycle notebook\n'],
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

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: JSON.stringify(notebook, null, 2) + '\n',
      name: 'editor-lifecycle.ipynb',
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
  await Explorer.shouldHaveItem('editor-lifecycle.ipynb')
}

export const run = async ({ Editor, Explorer, Notebook }: TestContext): Promise<void> => {
  try {
    await Explorer.openItem('editor-lifecycle.ipynb')
    await Notebook.splitCell(0)
    await Notebook.mergeCell(0)
    await Editor.saveAll()
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.updateWorkspaceSettings({ 'workbench.editorAssociations': undefined })
}
