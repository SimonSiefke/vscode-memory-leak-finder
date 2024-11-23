export const skip = true

export const setup = async ({ Workspace, Explorer }) => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }) => {
  await Explorer.newFolder({
    name: '',
    error: 'A file or folder name must be provided.',
  })
  await Explorer.cancel()
  await Explorer.refresh()
}
