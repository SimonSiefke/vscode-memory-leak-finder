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
}

export const run = async ({ Editor }) => {
  await Editor.open('file.ipynb')
  // await new Promise((r) => {
  //   setTimeout(r, 3000)
  // })
  await Editor.closeAll()
  // await new Promise((r) => {
  //   setTimeout(r, 3000)
  // })
}
