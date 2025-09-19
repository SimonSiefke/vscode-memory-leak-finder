import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.newFile('file-1.txt')
  await Explorer.focus()
  await Explorer.delete('file-1.txt')
  await Explorer.refresh()
}
