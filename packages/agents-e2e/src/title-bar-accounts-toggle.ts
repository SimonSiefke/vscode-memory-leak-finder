import type { TestContext } from '../../e2e/types.ts'

export const skip = process.platform === 'darwin'

let titleBar: any

export const setup = async ({ AgentsWindow, TitleBar }: TestContext): Promise<void> => {
  await AgentsWindow.newChat()
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
