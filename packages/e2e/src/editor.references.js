export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'index.css',
      content: `:root {
  --font-size: 10px;
  --font-size: 10px;
}`,
    },
  ])
  await Editor.open('index.css')
  await Editor.shouldHaveText(`:root {
  --font-size: 10px;
  --font-size: 10px;
}`)
  await Editor.shouldHaveToken('--font-size', 'rgb(156, 220, 254)')
  await Editor.save()
  await Editor.shouldHaveBreadCrumb(':root')
}

export const run = async ({ Editor, References }) => {
  await Editor.click('--font-size')
  await Editor.shouldHaveCursor(/(50px|53px|58px|66px)/)
  await Editor.findAllReferences()
  await References.shouldBeVisible()
  await References.shouldHaveMessage('2 results in 1 file')
  await References.clear()
}
