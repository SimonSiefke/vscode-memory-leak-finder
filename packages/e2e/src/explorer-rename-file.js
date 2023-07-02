export const skip = true

export const beforeSetup = async ({ Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'file-1.txt',
      content: '',
    },
    {
      name: 'file-2.txt',
      content: '',
    },
    {
      name: 'file-3.txt',
      content: '',
    },
  ])
  await Explorer.focus()
}

export const run = async ({ Explorer }) => {
  await Explorer.rename('file-2.txt', 'renamed.txt')
  await Explorer.rename('renamed.txt', 'file-2.txt')
}
