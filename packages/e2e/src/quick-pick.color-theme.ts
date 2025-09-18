import type { TestContext } from '../types.js'

export const setup = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.showColorTheme()
}

export const run = async ({ QuickPick, Workbench, Colors }: TestContext): Promise<void> => {
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.DarkPlus)
  await QuickPick.focusNext()
  await Workbench.shouldHaveEditorBackground(Colors.KimbieDark)
  await QuickPick.focusPrevious()
  await QuickPick.focusPrevious()
  await Workbench.shouldHaveEditorBackground(Colors.DarkModern)
}
