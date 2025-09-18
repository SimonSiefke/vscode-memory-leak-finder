import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace, Task  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Task.openRun()
}

export const run = async ({  Task  }: TestContext): Promise<void> => {
  await Task.pin('Configure a Task')
  await Task.unpin('Configure a Task')
}
