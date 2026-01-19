import type { TestContext } from '../types.ts'

export const skip = 1

const generateFileContent = (lines: number): string => {
  return Array(lines)
    .fill(0)
    .map((_, i) => `line ${i + 1}`)
    .join('\n')
}

export const setup = async ({ DiffEditor, Editor, Explorer, Workspace, SideBar }: TestContext): Promise<void> => {
  const file1Content = generateFileContent(100)
  const file2Content = generateFileContent(100)
    .split('\n')
    .map((line, i) => {
      // Create multiple diff sections:
      // Section 1: lines 10-20 (modified)
      // Section 2: lines 30-40 (unchanged)
      // Section 3: lines 50-60 (modified)
      // Section 4: lines 70-80 (unchanged)
      // Section 5: lines 90-100 (modified)
      if ((i >= 9 && i < 20) || (i >= 49 && i < 60) || (i >= 89 && i < 100)) {
        return `modified ${line}`
      }
      return line
    })
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
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file1.txt')
  await Explorer.shouldHaveItem('file2.txt')
  await SideBar.hide()

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
