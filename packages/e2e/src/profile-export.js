export const skip = true

export const setup = async ({ Editor, Electron, Workspace }) => {
  await Workspace.setFiles([])
  const filePath = Workspace.getWorkspaceFilePath('exported-profile.code-profile')
  await Electron.mockSaveDialog({
    filePath,
    canceled: false,
  })
  await Electron.mockDialog({
    response: 0,
  })
  await Editor.closeAll()
}

export const run = async ({ Profile, Explorer, Workspace }) => {
  await Profile.export({
    name: 'test',
  })
  await Explorer.shouldHaveItem('exported-profile.code-profile')
  await Workspace.setFiles([])
}
