import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Thread Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Thread Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Thread Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Thread Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Thread Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Thread Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
