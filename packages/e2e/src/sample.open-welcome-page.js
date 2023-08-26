export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ Editor, QuickPick, WellKnownCommands }) => {
  await QuickPick.executeCommand(WellKnownCommands.HelpWelcome)
  await Editor.closeAll()
}
