import type { TestContext } from '../types.ts'

export const skip = true

export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await Workspace.setFiles([])
}

export const run = async ({ Task, Editor, Workspace, SideBar, Explorer }: TestContext): Promise<void> => {
  await Task.open()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()
  await Explorer.refresh()
  await SideBar.hide()
}
