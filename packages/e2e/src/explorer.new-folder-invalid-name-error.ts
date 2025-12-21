import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Explorer, Workspace }: TestContext): Promise<void> => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }: TestContext): Promise<void> => {
  await Explorer.newFolder({
    error: `The name ${'a'.repeat(255)}... is not valid as a file or folder name. Please choose a different name.`,
    name: 'a'.repeat(5000),
  })
  await Explorer.cancel()
  await Explorer.refresh()
}
