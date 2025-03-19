export const skip = true

export const setup = async ({ Workspace, Editor }) => {
  await Workspace.setFiles([
    {
      name: 'file.txt',
      content: 'sample text',
    },
  ])
  await Editor.open('file.txt')
  await Editor.disableStickyScroll()
}

export const run = async ({ Editor }) => {
  await Editor.enableStickyScroll()
  await Editor.disableStickyScroll()
}
