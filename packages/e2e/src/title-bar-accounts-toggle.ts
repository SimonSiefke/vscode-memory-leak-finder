import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

let titleBar: any
let initialSettings: Record<string, unknown>

export const setup = async ({ TitleBar, Workspace }: TestContext): Promise<void> => {
  initialSettings = await Workspace.readWorkspaceSettings()
  await Workspace.updateWorkspaceSettings({ 'workbench.activityBar.location': 'top' })
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

export const teardown = async ({ Workspace }: TestContext): Promise<void> => {
  await Workspace.writeWorkspaceSettings(initialSettings)
}
