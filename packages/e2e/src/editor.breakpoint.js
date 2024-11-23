export const skip = true

export const setup = async ({ Workspace, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'file.html',
      content: 'sample text',
    },
  ])
  await Editor.open('file.html')
  await Editor.removeAllBreakpoints()
}

export const run = async ({ Editor }) => {
  await Editor.toggleBreakpoint()
  await Editor.toggleBreakpoint()
}
