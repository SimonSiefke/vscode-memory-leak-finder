import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Type Hierarchy Late Cancellation: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Type Hierarchy Late Cancellation: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Type Hierarchy Late Cancellation: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Type Hierarchy Late Cancellation: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Type Hierarchy Late Cancellation: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Type Hierarchy Late Cancellation: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
