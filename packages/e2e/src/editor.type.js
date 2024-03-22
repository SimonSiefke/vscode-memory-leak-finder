export const skip = false

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
  await Editor.shouldHaveText('sample text')
}

export const run = async ({ Editor }) => {
  await Editor.shouldHaveText('sample text')
  await Editor.type('More ')
  await Editor.shouldHaveText('More sample text')
  await Editor.deleteCharactersLeft({ count: 5 })
  await Editor.shouldHaveText('sample text')
  await Editor.save()
}
