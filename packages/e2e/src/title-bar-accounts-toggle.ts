import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

let titleBar: any

export const setup = async ({ TitleBar }: TestContext): Promise<void> => {
  titleBar = TitleBar
  // @ts-ignore
  await titleBar.ensureAccountsWidgetVisible()
}

export const run = async (): Promise<void> => {
  // @ts-ignore
  await titleBar.hideAccountsWidget()
  // @ts-ignore
  await titleBar.showAccountsWidget()
}
