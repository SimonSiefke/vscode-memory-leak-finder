import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.ensureAccountsWidgetVisible()
}

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.hideAccountsWidget()
  // @ts-ignore
  await TitleBar.showAccountsWidget()
}
