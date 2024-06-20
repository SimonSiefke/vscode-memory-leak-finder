export const setup = async ({ Workspace, Explorer }) => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }) => {
  await Explorer.newFile('file-1.txt')
  await Explorer.focus()
  await Explorer.delete('file-1.txt')
  await Explorer.refresh()
}
