import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Extensions }: TestContext) => {
  // @ts-ignore
  await Extensions.add({ expectedName: 'helloworld-sample', path: `packages/e2e/fixtures/sample.show-notification` })
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await QuickPick.showCommands()
  await QuickPick.type('Hello world')
  await QuickPick.select('Hello World')

  await Notification.shouldHaveItem('Hello World!')
  await Notification.closeAll()
}
