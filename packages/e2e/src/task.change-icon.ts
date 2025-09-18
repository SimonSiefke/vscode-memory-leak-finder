import type { TestContext } from '../types.js'

export const skip = true

export const setup = async ({ Editor, Workspace, Task }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Task.open()
  await Task.run('echo')
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  const fromIcon = 'tools'
  const toIcon = 'lightbulb'
  await Task.changeIcon(fromIcon, toIcon)
  await Task.changeIcon(toIcon, fromIcon)
}
