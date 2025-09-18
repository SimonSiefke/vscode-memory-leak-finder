import type { TestContext } from '../types.js'

export const skip = 1

export const setup = async ({ Editor, WelcomePage }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage }: TestContext): Promise<void> => {
  await WelcomePage.expandStep('findLanguageExtensions')
  await WelcomePage.expandStep('pickColorTheme')
}
