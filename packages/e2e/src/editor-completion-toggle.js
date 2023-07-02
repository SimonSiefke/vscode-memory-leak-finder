export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.open('index.html')
}

export const run = async ({ Suggest }) => {
  await Suggest.open()
  await Suggest.close()
}
