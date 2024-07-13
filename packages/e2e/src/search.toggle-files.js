export const setup = async ({ ActivityBar, Workspace, Search }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
  await Search.collapseFiles()
}

export const run = async ({ Search }) => {
  await Search.expandFiles()
  await Search.collapseFiles()
}
