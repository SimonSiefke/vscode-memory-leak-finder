export const skip = process.platform === 'win32'

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ ReleaseNotes, Editor }) => {
  await ReleaseNotes.show()
  await Editor.closeAll()
}
