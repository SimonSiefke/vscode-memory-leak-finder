import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Workspace, Explorer }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.newFolder({
    name: '',
    error: 'A file or folder name must be provided.',
  })
  await Explorer.cancel()
  await Explorer.refresh()
}
