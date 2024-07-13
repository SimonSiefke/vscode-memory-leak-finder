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
  await Editor.shouldHaveText('<h1>hello world</h1>')
  await Editor.shouldHaveCursor('0px')
  await Editor.closeFind()
}

export const run = async ({ Editor }) => {
  await Editor.openFind()
  await Editor.closeFind()
}
