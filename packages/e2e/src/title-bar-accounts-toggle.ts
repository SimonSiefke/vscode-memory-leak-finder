import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

let agentsWindow: any

export const setup = async ({ Workbench }: TestContext): Promise<void> => {
  agentsWindow = await Workbench.openChatWindow()
  // @ts-ignore
  await agentsWindow.TitleBar.ensureAccountsWidgetVisible()
}

export const run = async (): Promise<void> => {
  // @ts-ignore
  await agentsWindow.TitleBar.hideAccountsWidget()
  // @ts-ignore
  await agentsWindow.TitleBar.showAccountsWidget()
}
