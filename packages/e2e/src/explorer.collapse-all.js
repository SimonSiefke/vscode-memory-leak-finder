export const setup = async ({ Workspace, Explorer, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'folder-1/file-1.txt',
      content: 'file content 1',
    },
    {
      name: 'folder-1/file-2.txt',
      content: 'file content 2',
    },
    {
      name: 'folder-2/file-3.txt',
      content: 'file content 3',
    },
    {
      name: 'folder-2/file-4.txt',
      content: 'file content 4',
    },
  ])
  await Editor.closeAll()
  await Explorer.focus()
  await Explorer.shouldHaveItem('folder-1')
}

export const run = async ({ Explorer }) => {
  await Explorer.expand('folder-1')
  await Explorer.toHaveItem('file-1.txt')
  await Explorer.toHaveItem('file-2.txt')
  await Explorer.expand('folder-2')
  await Explorer.toHaveItem('file-3.txt')
  await Explorer.toHaveItem('file-4.txt')
  await Explorer.collapseAll()
  await Explorer.not.toHaveItem('file-1.txt')
  await Explorer.not.toHaveItem('file-2.txt')
  await Explorer.not.toHaveItem('file-3.txt')
  await Explorer.not.toHaveItem('file-4.txt')
  await Explorer.focus()
}
