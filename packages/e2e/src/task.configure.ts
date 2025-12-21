import type { TestContext } from '../types.ts'

export const skip = true

<<<<<<< HEAD
export const setup = async ({ Editor, Workspace, SideBar }: TestContext): Promise<void> => {
=======
export const setup = async ({ Editor, SideBar, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Editor.closeAll()
  await SideBar.hide()
  await Workspace.setFiles([])
}

<<<<<<< HEAD
export const run = async ({ Task, Editor, Workspace, SideBar, Explorer }: TestContext): Promise<void> => {
=======
export const run = async ({ Editor, Explorer, SideBar, Task, Workspace }: TestContext): Promise<void> => {
>>>>>>> origin/main
  await Task.open()
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Explorer.focus()
  await Explorer.refresh()
  await SideBar.hide()
}
