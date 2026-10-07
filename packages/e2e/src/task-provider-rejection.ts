import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Provider Rejection: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Provider Rejection: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Provider Rejection: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Provider Rejection: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Provider Rejection: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Provider Rejection: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
