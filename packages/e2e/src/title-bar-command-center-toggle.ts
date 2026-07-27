import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.ensureCommandCenterVisible()
}

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.hideCommandCenter()
  // @ts-ignore
  await TitleBar.showCommandCenter()
}
