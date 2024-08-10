export const setup = async ({ Workspace, Explorer, Editor }) => {
  const notebook1 = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
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
  const notebook2 = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['aa'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['bb'],
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
      name: 'notebook-1.ipynb',
      content: JSON.stringify(notebook1, null, 2) + '\n',
    },
    {
      name: 'notebook-2.ipynb',
      content: JSON.stringify(notebook2, null, 2) + '\n',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('notebook-1.ipynb')
  await Explorer.shouldHaveItem('notebook-2.ipynb')
  await Editor.open('notebook-1.ipynb')
}

export const run = async ({ Notebook, DiffEditor }) => {
  await DiffEditor.open('notebook-1.ipynb', 'notebook-2.ipynb')
}
