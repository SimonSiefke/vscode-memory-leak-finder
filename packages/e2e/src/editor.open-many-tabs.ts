import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  const files = []
  for (let i = 1; i <= 100; i++) {
    files.push({
      name: `${i}.txt`,
      content: `Content of file ${i}`,
    })
  }
  await Workspace.setFiles(files)
  await Editor.closeAll()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  for (let i = 1; i <= 100; i++) {
    await Editor.open(`${i}.txt`)
  }
  await Editor.closeAll()
}
