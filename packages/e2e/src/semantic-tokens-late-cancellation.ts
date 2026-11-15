import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Semantic Tokens Late Cancellation: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Semantic Tokens Late Cancellation: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Semantic Tokens Late Cancellation: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Semantic Tokens Late Cancellation: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Semantic Tokens Late Cancellation: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Semantic Tokens Late Cancellation: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
