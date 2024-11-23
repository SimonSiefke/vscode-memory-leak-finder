export const skip = true

export const setup = async ({ Editor, Workspace, Task }) => {
  await Editor.closeAll()
  await Workspace.setFiles([])
  await Task.open()
  await Task.run('echo')
}

export const run = async ({ Task }) => {
  const fromIcon = 'tools'
  const toIcon = 'lightbulb'
  await Task.changeIcon(fromIcon, toIcon)
  await Task.changeIcon(toIcon, fromIcon)
}
