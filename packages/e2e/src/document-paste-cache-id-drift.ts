import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Paste Cache Id Drift: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Paste Cache Id Drift: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Paste Cache Id Drift: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Paste Cache Id Drift: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Paste Cache Id Drift: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Paste Cache Id Drift: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
