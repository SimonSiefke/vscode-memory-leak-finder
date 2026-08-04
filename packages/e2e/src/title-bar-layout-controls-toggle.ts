import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.ensureLayoutControlsVisible()
}

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.hideLayoutControls()
  // @ts-ignore
  await TitleBar.showLayoutControls()
}
