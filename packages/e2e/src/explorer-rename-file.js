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
  await Explorer.shouldHaveItem('file-1.txt')
  await Explorer.shouldHaveItem('file-2.txt')
  await Explorer.shouldHaveItem('file-3.txt')
}

export const run = async ({ Explorer }) => {
  await Explorer.rename('file-2.txt', 'renamed.txt')
  await Explorer.rename('renamed.txt', 'file-2.txt')
}
