export const run = async ({ QuickPick }) => {
  await QuickPick.showCommands()
  await QuickPick.hide()
}
