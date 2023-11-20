export const setup = async ({ Workspace, Explorer }) => {
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

export const run = async ({ Explorer, Workspace }) => {
  await Workspace.add({
    name: 'file-4.txt',
    content: '',
  })
  await Explorer.refresh()
  await Explorer.shouldHaveItem('file-4.txt')
  await Workspace.remove('file-4.txt')
  await Explorer.refresh()
  await Explorer.not.toHaveItem('file-4.txt')
}
