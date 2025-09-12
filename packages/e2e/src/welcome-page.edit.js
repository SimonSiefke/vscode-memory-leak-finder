export const skip = 1

export const setup = async ({ Editor, WelcomePage }) => {
  await Editor.closeAll()
  await WelcomePage.show()
  await WelcomePage.showFundamentals()
}

export const run = async ({ WelcomePage }) => {
  await WelcomePage.expandStep('findLanguageExtensions')
  await WelcomePage.expandStep('pickColorTheme')
}
