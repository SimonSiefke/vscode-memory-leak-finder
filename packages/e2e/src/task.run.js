export const skip = true

export const setup = async ({ Editor, Workspace }) => {
  await Editor.closeAll()
  await Workspace.setFiles([])
}

export const run = async ({ Task }) => {
  await Task.open()
  await Task.run('echo')
}
