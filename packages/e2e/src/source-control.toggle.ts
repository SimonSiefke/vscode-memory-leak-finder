import type { TestContext } from '../types.ts'

export const setup = async ({ ActivityBar, Editor, Explorer, SideBar, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
  await SideBar.hide()
}

export const run = async ({ SideBar }: TestContext): Promise<void> => {
  await SideBar.show()
  await SideBar.hide()
}
