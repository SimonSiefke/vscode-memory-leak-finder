import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Extensions }: TestContext) => {
  // @ts-ignore
  await Extensions.add({ expectedName: 'notification-storm-sample', path: `packages/e2e/fixtures/sample.notification-storm` })
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Notification Storm')
  await QuickPick.select('Notification Storm')

  // Wait for all 50 notifications to appear
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Close all notifications
  await Notification.closeAll()
}
