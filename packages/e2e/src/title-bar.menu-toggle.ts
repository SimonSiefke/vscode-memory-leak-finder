import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  await TitleBar.showMenuFile()
  await TitleBar.hideMenuFile()
}
