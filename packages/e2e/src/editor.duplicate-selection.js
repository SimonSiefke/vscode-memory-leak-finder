export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.html',
      content: '<h1>hello world</h1>',
    },
  ])
  await Editor.open('index.html')
  await Editor.shouldHaveText('<h1>hello world</h1>')
}

export const run = async ({ Editor }) => {
  await Editor.shouldHaveText('<h1>hello world</h1>')
  await Editor.type('abc')
  await Editor.deleteCharactersLeft({ count: 3 })
  await Editor.duplicateSelection()
  await Editor.shouldHaveText('<h1>hello world</h1>\n<h1>hello world</h1>')
  await Editor.undo()
}
