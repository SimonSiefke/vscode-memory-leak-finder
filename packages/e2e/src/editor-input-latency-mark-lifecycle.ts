import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Editor Input Latency Mark Lifecycle: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Editor Input Latency Mark Lifecycle: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Editor }: TestContext): Promise<void> => {
  // Editor.type sends keyboard input through the real editor page object.
  await Editor.type('x'.repeat(250))
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Editor Input Latency Mark Lifecycle: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Editor Input Latency Mark Lifecycle: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
