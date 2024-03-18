export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.open('index.html')
}

export const run = async ({ Editor }) => {
  await Editor.select('h1')
  await Editor.shouldHaveSelection('8px', /(15px|17px)/)
  await Editor.cursorRight()
  await Editor.shouldHaveEmptySelection()
}
