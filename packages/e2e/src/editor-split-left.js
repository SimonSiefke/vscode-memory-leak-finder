export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.splitLeft()
  await Editor.closeAll()
}
