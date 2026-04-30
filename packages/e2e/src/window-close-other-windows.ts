import type { TestContext } from '../types.ts'

export const skip = true

export const run = async ({ Electron, QuickPick, TitleBar, WellKnownCommands, Window, Workbench }: TestContext): Promise<void> => {
  await Workbench.shouldBeVisible()
  await Electron.waitForWindowCount(1)

  await TitleBar.showMenuFile()
  // @ts-ignore
  await TitleBar.selectMenuItem(WellKnownCommands.NewWindow)

  await Electron.waitForWindowCount(2)

  await Window.focus()
  await QuickPick.executeCommand(WellKnownCommands.CloseOtherWindows)

  await Electron.waitForWindowCount(1)
  await Workbench.shouldBeVisible()
}
