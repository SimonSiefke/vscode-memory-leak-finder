import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, WelcomePage, SideBar }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await SideBar.hide()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage }: TestContext): Promise<void> => {
  await WelcomePage.expandStep('extensions')
  await WelcomePage.expandStep('terminal')
  await WelcomePage.expandStep('debugging')
  await WelcomePage.expandStep('scmSetup')
  await WelcomePage.expandStep('tasks')
  await WelcomePage.expandStep('shortcuts')
  await WelcomePage.expandStep('settingsAndSync')
}
