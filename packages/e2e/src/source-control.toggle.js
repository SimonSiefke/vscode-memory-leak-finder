export const skip = true

export const setup = async ({ Editor, Workspace, Explorer, ActivityBar }) => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
}

export const run = async ({ ActivityBar, Explorer, SideBar }) => {
  await SideBar.hide()
  await ActivityBar.showSourceControl()
}
