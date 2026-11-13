import type { TestContext } from '../types.js'

export const skip = process.platform === 'darwin'

export const setup = async ({ QuickPick, TitleBar }: TestContext): Promise<void> => {
  // The harness excludes the fixture workspace from file watching, so use the
  // layout command instead of writing a workspace setting after launch.
  await QuickPick.executeCommand('View: Move Activity Bar to Top')
  // @ts-ignore
  await TitleBar.ensureAccountsWidgetVisible()
}

export const run = async ({ TitleBar }: TestContext): Promise<void> => {
  // @ts-ignore
  await TitleBar.hideAccountsWidget()
  // @ts-ignore
  await TitleBar.showAccountsWidget()
}

export const teardown = async ({ QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('View: Move Activity Bar to Side')
}
