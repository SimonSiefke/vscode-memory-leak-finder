import type { TestContext } from '../types.ts'

export const skip = 1

const cleanup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  await QuickPick.executeCommand('Quick Pick Late Items: Cleanup')
  // Selecting a command does not await its extension callback.
  await Notification.shouldHaveItem('Quick Pick Late Items: cleanup complete (live quick picks: 0)')
  await Notification.closeAll({ force: true })
}

export const run = async (context: TestContext): Promise<void> => {
  const { Notification, QuickPick } = context
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Quick Pick Late Items: Open', { stayVisible: true })
    await QuickPick.shouldHaveItem('Initial item')
    await QuickPick.type('late')
    // The extension shows this item only after its value-change handler started the deferred load.
    await QuickPick.shouldHaveItem('Loading results…')
    await QuickPick.hide()
    await QuickPick.executeCommand('Quick Pick Late Items: Release')
    // The notification is posted after the late items reached the renderer.
    await Notification.shouldHaveItem('Quick Pick Late Items: late items applied (value: late, hide events: 1)')
    await QuickPick.shouldBeHidden()
    await QuickPick.shouldNotHaveItem('Late item')
  } finally {
    await cleanup(context)
  }
}

export const teardown = async (context: TestContext): Promise<void> => {
  await cleanup(context)
}
