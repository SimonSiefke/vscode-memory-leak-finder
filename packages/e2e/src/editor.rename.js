export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `:root {
  --font-size: 10px;
}`,
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`)
  await Editor.type('abc')
  await Editor.deleteCharactersLeft({ count: 3 })
  await Editor.shouldHaveToken('--font-size', 'rgb(156, 220, 254)')
}

export const run = async ({ Editor }) => {
  await Editor.click('--font-size')
  await Editor.shouldHaveCursor(/(50px|53px|58px|66px)/)
  await Editor.rename('--abc')
  await Editor.shouldHaveText(`:root {
  --abc: 10px;
}`)
  await Editor.rename('--font-size')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
}`)
}
