import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ DiffEditor, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const notebook1 = {
    cells: [
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
      },
      {
        cell_type: 'code',
        metadata: {},
        source: ['a'],
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
      content: JSON.stringify(notebook1, null, 2) + '\n',
      name: 'notebook-1.ipynb',
    },
    {
      content: JSON.stringify(notebook2, null, 2) + '\n',
      name: 'notebook-2.ipynb',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('notebook-1.ipynb')
  await Explorer.shouldHaveItem('notebook-2.ipynb')
  await Editor.open('notebook-1.ipynb')

  // @ts-ignore
  await DiffEditor.open({ file1: 'notebook-1.ipynb', file2: 'notebook-2.ipynb' })
  await DiffEditor.shouldHaveOriginalEditor('a')
  await DiffEditor.shouldHaveModifiedEditor('aa')
}

export const run = async ({ DiffEditor }: TestContext): Promise<void> => {
  await DiffEditor.scrollDown()
  await DiffEditor.scrollUp()
}
