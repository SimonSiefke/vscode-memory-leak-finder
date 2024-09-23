export const skip = true

export const setup = async ({ Editor, Workspace, Hover }) => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `h1 {
  color: yellow;
  --font-size: 10px;
  --font-size: 10px;
}`,
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`h1 {
  color: yellow;
  --font-size: 10px;
  --font-size: 10px;
}`)
  await Editor.hover(
    'color',
    `Sets the color of an element's text

(Edge 12, Firefox 1, Safari 1, Chrome 1, IE 3, Opera 3)

Syntax: <color>`,
  )
  await Hover.hide()
}

export const run = async ({ Editor, References }) => {
  await Editor.click('--font-size')
  await Editor.shouldHaveCursor(/(50px|53px|58px|66px)/)
  await Editor.findAllReferences()
  await References.shouldBeVisible()
  await References.shouldHaveMessage('2 results in 1 file')
  await References.clear()
}
