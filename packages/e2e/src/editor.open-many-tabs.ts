import type { TestContext } from '../types.ts'

export const skip = 1

<<<<<<< HEAD
export const setup = async ({ Workspace, Editor }: TestContext): Promise<void> => {
  const files = []
  for (let i = 1; i <= 25; i++) {
    files.push({
      name: `${i}.txt`,
      content: `Content of file ${i}`,
=======
export const setup = async ({ Editor, Workspace }: TestContext): Promise<void> => {
  const files = []
  for (let i = 1; i <= 25; i++) {
    files.push({
      content: `Content of file ${i}`,
      name: `${i}.txt`,
>>>>>>> origin/main
    })
  }
  await Workspace.setFiles(files)
  await Editor.closeAll()
}

export const run = async ({ Editor, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  // @ts-ignore
  await Explorer.openAllFiles()
  await Editor.closeAll()
}
