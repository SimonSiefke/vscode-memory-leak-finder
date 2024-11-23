export const skip = true

export const setup = async ({ Editor, Workspace, Task }) => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Task.openRun()
}

export const run = async ({ Task }) => {
  await Task.pin('Configure a Task')
  await Task.unpin('Configure a Task')
}
