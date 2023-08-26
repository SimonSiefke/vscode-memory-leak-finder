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
  await Editor.splitUp()
  await Editor.closeAll()
}
