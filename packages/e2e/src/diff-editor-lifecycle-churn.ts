import type { TestContext } from '../types.ts'

export const skip = 1

const original = `first line
second line
third line
`

const modified = `first line
second line updated
third line
fourth line
`

export const setup = async ({ Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    { content: original, name: 'original.txt' },
    { content: modified, name: 'modified.txt' },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.refresh()
  await Explorer.shouldHaveItem('original.txt')
  await Explorer.shouldHaveItem('modified.txt')
}

export const run = async ({ DiffEditor, Editor }: TestContext): Promise<void> => {
  try {
    await DiffEditor.open({
      cell1Content: '',
      cell2Content: '',
      file1: 'original.txt',
      file1Content: '',
      file2: 'modified.txt',
      file2Content: '',
    })
    await DiffEditor.shouldHaveOriginalEditor(original)
    await DiffEditor.shouldHaveModifiedEditor(modified)
  } finally {
    await Editor.closeAll()
  }
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
