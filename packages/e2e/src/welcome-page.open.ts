import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({  Editor  }: TestContext): Promise<void> => {
  await Editor.closeAll()
}

export const run = async ({  WelcomePage  }: TestContext): Promise<void> => {
  await WelcomePage.show()
  await WelcomePage.hide()
}
