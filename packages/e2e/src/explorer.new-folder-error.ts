import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.newFolder({
    error: 'A file or folder name must be provided.',
    name: '',
  })
  await Explorer.cancel()
  await Explorer.refresh()
}
