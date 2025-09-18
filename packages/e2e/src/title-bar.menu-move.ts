import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ TitleBar }: TestContext): Promise<void> => {
  await TitleBar.showMenuFile()
}

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  await TitleBar.showMenuEdit()
  await TitleBar.showMenuFile()
}
