export const setup = async ({ Workspace, Explorer, Editor }) => {
  await Workspace.setFiles([])
  await Editor.closeAll()
  await Explorer.focus()
}

export const run = async ({ Editor }) => {
  await Editor.newTextFile()
  await Editor.closeAll()
}
