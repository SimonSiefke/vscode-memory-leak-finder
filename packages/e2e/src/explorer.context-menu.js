export const skip = process.platform === 'darwin'

export const setup = async ({ Workspace, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'a.txt',
      content: 'a',
    },
    {
      name: 'b.txt',
      content: 'b',
    },
  ])
  await Editor.closeAll()
}

export const run = async ({ Explorer, ContextMenu }) => {
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
  await Explorer.focus()
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
}
