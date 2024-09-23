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
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
  await Search.clear()
}
