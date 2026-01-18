import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ ActivityBar, Editor, Explorer, SideBar, Task, Workspace }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await ActivityBar.showExplorer()
  await Explorer.refresh()
  await SideBar.hide()
  await Task.open()
}

export const run = async ({ Task }: TestContext): Promise<void> => {
  await Task.run('echo')
  await Task.clear()
}
