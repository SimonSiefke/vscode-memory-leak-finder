import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Session Option Command Replacement: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Session Option Command Replacement: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Session Option Command Replacement: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Session Option Command Replacement: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Session Option Command Replacement: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Session Option Command Replacement: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
