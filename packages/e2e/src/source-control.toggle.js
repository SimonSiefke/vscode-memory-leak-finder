export const setup = async ({ Editor, Workspace, Explorer, SideBar, ActivityBar }) => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
  await ActivityBar.showSourceControl()
  await SideBar.hide()
}

export const run = async ({ SideBar }) => {
  await SideBar.show()
  await SideBar.hide()
}
