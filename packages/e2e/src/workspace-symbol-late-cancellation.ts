import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Workspace Symbol Late Cancellation: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Workspace Symbol Late Cancellation: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Workspace Symbol Late Cancellation: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Workspace Symbol Late Cancellation: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Workspace Symbol Late Cancellation: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Workspace Symbol Late Cancellation: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
