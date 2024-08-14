export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: `abc
def`,
    },
  ])
  await Editor.open('file.js')
}

export const run = async ({ Editor }) => {
  await Editor.goToFile({ file: 'file.js', line: 2, column: 1 })
  await Editor.autoFix()
}
