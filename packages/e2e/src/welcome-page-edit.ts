import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, WelcomePage }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage }: TestContext): Promise<void> => {
  await WelcomePage.expandStep('pickColorTheme')
  await WelcomePage.expandStep('videoTutorial')
}
