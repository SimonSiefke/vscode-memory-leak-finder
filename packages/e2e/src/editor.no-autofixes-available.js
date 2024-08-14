export const skip = true

export const beforeSetup = async ({ Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.js',
      content: `abc
def`,
    },
  ])
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.js')
}

export const run = async ({ Editor }) => {
  await Editor.goToFile({ file: 'file.js', line: 2, column: 1 })
}
