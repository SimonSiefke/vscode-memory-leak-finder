export const skip = false

export const setup = async ({ Editor, Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.html')
  await Editor.open('index.html')
}

export const run = async ({ Editor }) => {
  await Editor.showColorPicker()
  await Editor.hideColorPicker()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
