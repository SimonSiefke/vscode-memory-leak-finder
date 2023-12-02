export const skip = true

export const setup = async ({ Editor }) => {
  await Editor.closeAll()
}

export const run = async ({ WelcomePage }) => {
  await WelcomePage.show()
  await WelcomePage.hide()
}
