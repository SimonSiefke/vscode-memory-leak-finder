export const skip = false

export const setup = async ({ Editor, Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'index.txt',
      content: 'hello world',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('index.txt')
  await Editor.open('index.txt')
  await Editor.shouldHaveText('hello world')
}

export const run = async ({ Editor }) => {
  await Editor.showColorPicker()
  await Editor.hideColorPicker()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
