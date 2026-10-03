import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Completion Throwing Lifetime: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Completion Throwing Lifetime: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Completion Throwing Lifetime: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Completion Throwing Lifetime: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Completion Throwing Lifetime: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Completion Throwing Lifetime: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
