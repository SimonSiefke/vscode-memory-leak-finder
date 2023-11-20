export const setup = async ({ Workspace, Editor, Explorer }) => {
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
  await Explorer.focus()
  await Explorer.shouldHaveItem('a.txt')
  await Explorer.shouldHaveItem('b.txt')
}

export const run = async ({ Editor, Explorer, ContextMenu, DiffEditor }) => {
  await Explorer.openContextMenu('a.txt')
  await ContextMenu.select('Select for Compare')
  await Explorer.openContextMenu('b.txt')
  await ContextMenu.select('Compare with Selected')
  await DiffEditor.expectOriginal('a')
  await DiffEditor.expectModified('b')
  await Editor.close()
}
