export const skip = true

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
    {
      name: 'file-4.txt',
      content: '',
    },
  ])
  await Explorer.focus()
}

export const run = async ({ Explorer, QuickPick }) => {
  await Explorer.copy('file-1.txt')
  await Explorer.paste()
  await Explorer.shouldHaveFocusedItem('file-1 copy.txt')
  await Explorer.delete('file-1 copy.txt')
  await Explorer.shouldHaveFocusedItem('file-1.txt')
}
