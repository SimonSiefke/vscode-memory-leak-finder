import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const notebook = {
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
  await Notebook.scrollDown()
  await Notebook.scrollUp()
}
