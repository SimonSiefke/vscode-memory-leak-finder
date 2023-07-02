export const skip = true

export const setup = async ({ Workspace }) => {
  await Workspace.setFiles([
    {
      nameL: 'file.txt',
      content: '',
    },
  ])
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
