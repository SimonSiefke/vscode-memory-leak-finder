export const setup = async ({ Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: '',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.txt')
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
