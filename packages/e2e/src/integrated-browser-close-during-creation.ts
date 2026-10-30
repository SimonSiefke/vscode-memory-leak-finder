import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Close During Creation: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Close During Creation: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Close During Creation: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Close During Creation: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Close During Creation: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Close During Creation: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
