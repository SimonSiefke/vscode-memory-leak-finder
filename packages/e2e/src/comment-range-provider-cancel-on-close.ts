import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Range Provider Cancel On Close: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Range Provider Cancel On Close: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Range Provider Cancel On Close: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Range Provider Cancel On Close: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Comment Range Provider Cancel On Close: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Comment Range Provider Cancel On Close: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
