export const setup = async ({ Workspace, Explorer, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'file.ipynb',
      content: '',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('file.ipynb')
}

export const run = async ({ Editor }) => {
  await Editor.open('file.ipynb')
  await Editor.closeAll()
}
