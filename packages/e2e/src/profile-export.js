export const setup = async ({ Editor, Electron }) => {
  await Electron.mockSaveDialog({
    filePath: '/tmp/exported-profile.code-profile',
    canceled: false,
  })
  await Editor.closeAll()
}

export const run = async ({ Profile }) => {
  await Profile.export({
    name: 'test',
  })
}
