import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Colors, QuickPick, Workbench }: TestContext): Promise<void> => {
  await QuickPick.showColorTheme()
  await Workbench.shouldHaveEditorBackground([Colors.DarkModern, Colors.DarkModernNew])
  await QuickPick.type('Dark+')
  await QuickPick.pressEnter()
  await Workbench.shouldHaveEditorBackground(Colors.DarkPlus)
  await QuickPick.showColorTheme()
  await QuickPick.type('Kimbie Dark')
  await QuickPick.pressEnter()
  await Workbench.shouldHaveEditorBackground(Colors.KimbieDark)
  await QuickPick.showColorTheme()
  await QuickPick.type('Dark Modern')
  await QuickPick.pressEnter()
  await Workbench.shouldHaveEditorBackground([Colors.DarkModern, Colors.DarkModernNew])
}
