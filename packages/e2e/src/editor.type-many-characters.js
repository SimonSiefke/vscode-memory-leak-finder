export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.txt')
}

export const run = async ({ Editor }) => {
  for (let i = 0; i < 100; i++) {
    await Editor.type('a')
  }
  await Editor.deleteAll()
  await Editor.save()
}
