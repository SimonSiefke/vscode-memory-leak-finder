export const setup = async ({ Workspace, Explorer, Editor }) => {
  const notebook = {
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'markdown',
        metadata: {},
        source: ['aa'],
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
      name: 'test.ipynb',
      content: JSON.stringify(notebook, null, 2) + '\n',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('test.ipynb')
  await Editor.open('test.ipynb')
}

export const run = async ({ Notebook }) => {
  await Notebook.scrollDown()
  await Notebook.scrollUp()
}
