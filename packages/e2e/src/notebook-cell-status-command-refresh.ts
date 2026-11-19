import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Cell Status Command Refresh: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Cell Status Command Refresh: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Cell Status Command Refresh: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Cell Status Command Refresh: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Cell Status Command Refresh: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Cell Status Command Refresh: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
