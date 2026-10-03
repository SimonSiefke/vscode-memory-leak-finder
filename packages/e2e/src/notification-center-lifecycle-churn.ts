import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Extensions }: TestContext): Promise<void> => {
  await Extensions.add({
    expectedName: 'helloworld-sample',
    path: 'packages/e2e/fixtures/sample.show-notification',
  })
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.executeCommand('Hello World')
  await Notification.shouldHaveItem('Hello World!')
  await QuickPick.executeCommand('Notifications: Show Notifications')
  await Notification.closeAll({ force: true })
}

export const teardown = async ({ Notification }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
}
