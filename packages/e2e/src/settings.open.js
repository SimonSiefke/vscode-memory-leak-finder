export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Settings, Editor }) => {
  await Settings.open()
  await Editor.closeAll()
}
