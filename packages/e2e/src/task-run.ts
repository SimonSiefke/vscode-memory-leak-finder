import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace, SideBar, Task }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await SideBar.hide()
  await Task.open()
}

export const run = async ({ Task, Terminal }: TestContext): Promise<void> => {
  await Task.run('echo')
  await Terminal.clear()
}
