import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.hideMenuBar()
  // @ts-ignore
  await TitleBar.showMenuBar()
}
