import type { TestContext } from '../types.js'

export const setup = async ({ Workspace, Explorer, Editor }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.newTextFile()
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
