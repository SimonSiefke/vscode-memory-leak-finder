export const setup = async ({ ActivityBar, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
}

export const run = async ({ Search }) => {
  await Search.expandFiles(['file.txt1', 'sample text'])
  await Search.collapseFiles(['file.txt1', 'sample text'])
}
