export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: `abc
def`,
    },
  ])
  await Editor.open('file.js')
  await Editor.goToFile({ file: 'file.js', line: 2, column: 1 })
}

export const run = async ({ Editor }) => {
  await Editor.autoFix({ hasFixes: false })
  await Editor.closeAutoFix()
}
