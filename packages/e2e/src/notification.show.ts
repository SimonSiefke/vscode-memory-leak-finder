import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Extensions }: TestContext) => {
  // @ts-ignore
  await Extensions.add(`packages/e2e/fixtures/sample.show-notification`, 'helloworld-sample')
}

export const run = async ({ QuickPick, Notification }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Hello world')
  await QuickPick.select('Hello World')

  // @ts-ignore
  await Notification.shouldHaveItem('Hello World!')
  await Notification.closeAll()
}
