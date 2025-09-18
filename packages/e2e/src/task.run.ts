import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({  Editor, Workspace  }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}

export const run = async ({  Task  }: TestContext): Promise<void> => {
  await Task.open()
  await Task.run('echo')
}
