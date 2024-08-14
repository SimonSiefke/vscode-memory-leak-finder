export const skip = true

export const beforeSetup = async ({ Workspace }) => {
  await Workspace.setFiles([
    {
      name: 'file.css',
      content: `h1 {
  font-size: 20px
}

h2 {
  font-size: 15px;
}`,
    },
  ])
}

export const setup = async ({ Editor }) => {
  await Editor.open('file.css')
}

export const run = async ({ Editor }) => {
  await Editor.goToFile({ file: 'file.css', line: 2, column: 2 })
}
