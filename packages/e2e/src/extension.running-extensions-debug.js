export const setup = async ({ Editor, RunningExtensions }) => {
  await Editor.closeAll()
  await RunningExtensions.show()
}

export const run = async ({ RunningExtensions }) => {
  await RunningExtensions.startDebuggingExtensionHost()
}
