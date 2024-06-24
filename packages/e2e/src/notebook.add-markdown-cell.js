export const skip = true

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
  await Editor.open('file.ipynb')
}

export const run = async ({ Notebook }) => {
  await Notebook.addMarkdownCell()
  await Notebook.removeMarkdownCell()
}
