import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Text Document Unique Resource Marks: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Text Document Unique Resource Marks: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Text Document Unique Resource Marks: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Text Document Unique Resource Marks: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Text Document Unique Resource Marks: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Text Document Unique Resource Marks: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
