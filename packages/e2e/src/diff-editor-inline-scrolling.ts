import type { TestContext } from '../types.ts'

export const skip = 1

const generateFileContent = (lines: number): string => {
  return Array(lines)
    .fill(0)
    .map((_, i) => `line ${i + 1}`)
    .join('\n')
}

export const setup = async ({ DiffEditor, Editor, Explorer, Workspace, SideBar, QuickPick }: TestContext): Promise<void> => {
  const file1Content = generateFileContent(100)
  const file2Content = generateFileContent(100)
    .split('\n')
    .map((line, i) => {
      // Create multiple small, irregular diff sections:
      // Line 5-7 (3 lines), 10-12 (3 lines), 15-18 (4 lines), 22-23 (2 lines),
      // 28-30 (3 lines), 33-36 (4 lines), 40-41 (2 lines), 45-48 (4 lines),
      // 52-53 (2 lines), 58-60 (3 lines), 65-67 (3 lines), 72-75 (4 lines),
      // 80-81 (2 lines), 85-88 (4 lines), 92-94 (3 lines), 97-99 (3 lines)
      const diffRanges = [
        [4, 7], // 3 lines
        [9, 12], // 3 lines
        [14, 18], // 4 lines
        [21, 23], // 2 lines
        [27, 30], // 3 lines
        [32, 36], // 4 lines
        [39, 41], // 2 lines
        [44, 48], // 4 lines
        [51, 53], // 2 lines
        [57, 60], // 3 lines
        [64, 67], // 3 lines
        [71, 75], // 4 lines
        [79, 81], // 2 lines
        [84, 88], // 4 lines
        [91, 94], // 3 lines
        [96, 99], // 3 lines
      ]
      const isInDiff = diffRanges.some(([start, end]) => i >= start && i < end)
      if (isInDiff) {
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
    file1Content: '',
    file2: 'file2.txt',
    file2Content: '',
  })
  await QuickPick.executeCommand('Compare: Toggle Inline View')
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
