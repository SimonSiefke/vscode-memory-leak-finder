export const setup = async ({ Workspace, Explorer, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: '',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.txt')
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
