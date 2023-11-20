export const setup = async ({ QuickPick }) => {
  await QuickPick.showColorTheme()
}

export const run = async ({ QuickPick, Workbench, Colors }) => {
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.DarkPlus)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.KimbieDark)
  await QuickPick.focusPrevious()
  await QuickPick.focusPrevious()
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
}
