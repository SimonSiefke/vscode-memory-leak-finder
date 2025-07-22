// export const skip = true

const generateFileContent = () => {
  return Array(200).fill('sample text').join('\n')
}

export const setup = async ({ Editor, Workspace }) => {
  await Editor.closeAll()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: generateFileContent(),
    },
  ])
  await Editor.open('file.txt')
}

export const run = async ({ Editor }) => {
  await Editor.moveScrollBar(200, 23)
  // await Editor.moveScrollBar(0, 0)
}

export const teardown = async ({ Editor }) => {
  // await Editor.closeAll()
}
