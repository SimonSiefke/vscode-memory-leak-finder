import type { TestContext } from '../types.ts'

// Install sample.hidden-status-command-replacement before launch; see its fixture README.
// Installing during setup restarts the extension host and disconnects memory measures.
export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Hidden Status Command: Cleanup')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Hidden Status Command cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Hidden Status Command: Run')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Hidden Status Command complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Hidden Status Command: Cleanup')
    // Command selection does not await the extension callback.
    await Notification.shouldHaveItem('Hidden Status Command cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
