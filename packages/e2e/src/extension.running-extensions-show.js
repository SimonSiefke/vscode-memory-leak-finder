export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Editor, RunningExtensions }) => {
  await RunningExtensions.show()
  await Editor.closeAll()
}
