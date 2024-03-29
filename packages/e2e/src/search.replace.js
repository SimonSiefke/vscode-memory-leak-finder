export const skip = true

export const setup = async ({ ActivityBar, Electron, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await ActivityBar.showSearch()
  await Electron.mockDialog({ response: 1 })
}

export const run = async ({ Search }) => {
  await Search.type('sample')
  await Search.toHaveResults(['file.txt1', 'sample text'])
  await Search.typeReplace('other')
  await Search.replace()
  await Search.typeReplace('')
  await Search.type('other')
  await Search.toHaveResults(['file.txt1', 'other text'])
  await Search.typeReplace('sample')
  await Search.replace()
  await Search.typeReplace('')
}
