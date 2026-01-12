import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace, ActivityBar, Explorer }: TestContext): Promise<void> => {
  const files = []
  const count = 25
  for (let i = 1; i <= count; i++) {
    files.push({
      content: `Content of file ${i}`,
      name: `${i}.txt`,
    })
  }
  await Workspace.setFiles(files)
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await Explorer.shouldHaveItem(`1.txt`)
  await Editor.closeAll()
}

export const run = async ({ Editor, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Explorer.openAllFiles()
  await Editor.closeAll()
}
