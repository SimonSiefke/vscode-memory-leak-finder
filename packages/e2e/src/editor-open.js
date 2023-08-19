export const setup = async ({ Workspace, Explorer }) => {
  await Explorer.focus()
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: '',
    },
  ])
  await Explorer.waitForReady('file.txt')
}

export const run = async ({ Editor }) => {
  await Editor.open('file.txt')
  await Editor.close()
}
