import type { TestContext } from '../types.js'

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Explorer.focus()
  await Explorer.refresh()
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.newFile('file-1.txt')
  await Explorer.focus()
  await Explorer.delete('file-1.txt')
  await Explorer.refresh()
}
