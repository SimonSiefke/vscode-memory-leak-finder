export const beforeSetup = async ({ Workspace, Explorer }) => {
  await Workspace.setFiles([
    {
      name: 'file-1.txt',
      content: 'file content 1',
    },
    {
      name: 'file-2.txt',
      content: 'file content 2',
    },
    {
      name: 'folder/file-3.txt',
      content: 'file content 3',
    },
    {
      name: 'folder/file-4.txt',
      content: 'file content 4',
    },
  ])
  await Explorer.focus()
  await Explorer.shouldHaveItem('file-1.txt')
}

export const run = async ({ Explorer }) => {
  await Explorer.expand('folder')
  await Explorer.toHaveItem('file-3.txt')
  await Explorer.toHaveItem('file-4.txt')
  await Explorer.collapse('folder')
  await Explorer.not.toHaveItem('file-3.txt')
  await Explorer.not.toHaveItem('file-4.txt')
}
