import type { TestContext } from '../types.ts'

export const skip = 1

const generateFileContent = (lines: number): string => {
  return Array(lines)
    .fill(0)
    .map((_, i) => `line ${i + 1}`)
    .join('\n')
}

export const setup = async ({ DiffEditor, Editor, Explorer, Workspace }: TestContext): Promise<void> => {
  const file1Content = generateFileContent(100)
  const file2Content = generateFileContent(100)
    .split('\n')
    .map((line, i) => (i < 50 ? line : `modified ${line}`))
    .join('\n')

  await Workspace.setFiles([
    {
      content: file1Content,
      name: 'file1.txt',
    },
    {
      content: file2Content,
      name: 'file2.txt',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file1.txt')
  await Explorer.shouldHaveItem('file2.txt')

  // @ts-ignore
  await DiffEditor.open({
    file1: 'file1.txt',
    file1Content: 'line 1',
    file2: 'file2.txt',
    file2Content: 'line 1',
  })
}

export const run = async ({ DiffEditor }: TestContext): Promise<void> => {
  await DiffEditor.scrollDownInline()
  await DiffEditor.scrollDownInline()
  await DiffEditor.scrollUpInline()
  await DiffEditor.scrollUpInline()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
