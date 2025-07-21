export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `h1{
    abc
}`,
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveSquigglyError()
}

export const run = async ({ Editor, Hover }) => {
  await Editor.shouldHaveSquigglyError()
  await Editor.hover('}')
  await Hover.shouldHaveText('colon expected')
  await Editor.click('abc')
  await Editor.deleteCharactersRight({ count: 4 })
  await Editor.shouldNotHaveSquigglyError()
  await Editor.type(' abc')
  await Editor.shouldHaveSquigglyError()
}

export const teardown = async ({ Editor }) => {
  await Editor.closeAll()
}
