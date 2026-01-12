import type { TestContext } from '../types.ts'

export const setup = async ({ Editor, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
}

export const run = async ({ Editor, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Developer: Startup Performance')
  // @ts-ignore
  await Editor.shouldHaveFile('Startup Performance')
  await Editor.closeAll()
}

export const teardown = async ({ Editor }: TestContext): Promise<void> => {
  await Editor.closeAll()
}
