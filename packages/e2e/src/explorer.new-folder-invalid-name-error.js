export const skip = true

export const setup = async ({ Workspace, Explorer }) => {
  await Explorer.focus()
  await Workspace.setFiles([])
  await Explorer.refresh()
}

export const run = async ({ Explorer }) => {
  await Explorer.newFolder({
    name: 'a'.repeat(5000),
    error: `The name ${'a'.repeat(255)}... is not valid as a file or folder name. Please choose a different name.`,
  })
  await Explorer.cancel()
  await Explorer.refresh()
}
