export const skip = true

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

export const run = async ({ Editor, Hover }) => {
  await Editor.hover('h1', 'The h1 element represents a section heading.MDN Reference')
  await Hover.hide()
}
