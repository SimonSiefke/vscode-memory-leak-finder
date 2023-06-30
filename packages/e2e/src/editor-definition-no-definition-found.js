export const skip = true

export const setup = async ({ Editor }) => {
  await Editor.open('index.html')
}

export const run = async ({ Editor }) => {
  await Editor.click('h1')
  await Editor.goToDefinition()
  await Editor.shouldHaveOverlayMessage('No definition found')
}
