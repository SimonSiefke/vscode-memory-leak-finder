export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.css',
      content: `h1 {
  font-size: 20px;
}
`,
    },
  ])
  await Editor.closeAll()
  await Editor.open('file.css')
  await Editor.shouldHaveText(`h1 {
  font-size: 20px;
}
`)
  await Editor.shouldHaveCursor('0px')
}

export const run = async ({ Editor }) => {
  await Editor.inspectTokens()
  await Editor.shouldHaveInspectedToken('h12 chars')
  await Editor.closeInspectedTokens()
}
