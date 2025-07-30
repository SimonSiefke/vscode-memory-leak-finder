export const skip = true

export const setup = async ({ ActivityBar, Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Explorer.focus()
  await ActivityBar.showSearch()
}

export const run = async ({ ActivityBar, SideBar, Explorer }) => {
  await SideBar.hide()
  await SideBar.show()
}
