import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  const files = []
  for (let i = 1; i <= 25; i++) {
    files.push({
      content: `Content of file ${i}`,
      name: `${i}.txt`,
    })
  }
  await Workspace.setFiles(files)
  await Editor.closeAll()
}

export const run = async ({ Editor, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()

  await Explorer.openAllFiles()
  await Editor.closeAll()
}
