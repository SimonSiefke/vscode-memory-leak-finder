import type { TestContext } from '../types.ts'

export const run = async ({ QuickPick, Workbench, Colors }: TestContext): Promise<void> => {
  await QuickPick.showColorTheme()
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.DarkPlus)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.KimbieDark)
  await QuickPick.focusPrevious()
  await QuickPick.focusPrevious()
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
  await QuickPick.hide()
}
