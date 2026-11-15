import type { TestContext } from '../types.ts'

// Install sample.test-run-profile-disposal before launch; see its fixture README.
// Installing during setup restarts the extension host and disconnects memory measures.
export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Run Profile: Cleanup')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Test Run Profile cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Run Profile: Run')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Test Run Profile complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Run Profile: Cleanup')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Test Run Profile cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
