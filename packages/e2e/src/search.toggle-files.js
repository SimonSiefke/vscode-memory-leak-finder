export const skip = true

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
  await Search.expandFiles(['file.txt1', 'sample text'])
  await Search.collapseFiles(['file.txt1', 'sample text'])
}
