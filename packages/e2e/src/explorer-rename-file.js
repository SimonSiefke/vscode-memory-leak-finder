export const skip = process.platform === 'darwin'

export const setup = async ({ Workspace, Explorer }) => {
  await Explorer.focus()
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
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-1.txt')
  await Explorer.shouldHaveItem('file-2.txt')
  await Explorer.shouldHaveItem('file-3.txt')
}

export const run = async ({ Explorer }) => {
  await Explorer.rename('file-2.txt', 'renamed.txt')
  await Explorer.rename('renamed.txt', 'file-2.txt')
}
