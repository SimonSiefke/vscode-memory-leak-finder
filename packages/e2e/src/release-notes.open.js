export const skip = true

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ ReleaseNotes, Editor }) => {
  await ReleaseNotes.show()
  await Editor.closeAll()
}
