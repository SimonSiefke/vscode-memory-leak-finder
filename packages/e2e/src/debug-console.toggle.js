export const skip = true

export const run = async ({ DebugConsole }) => {
  await DebugConsole.show()
  await DebugConsole.hide()
}
