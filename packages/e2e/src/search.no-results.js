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
  await Search.type('not-found')
  await Search.shouldHaveNoResults()
  await Search.clear()
}
