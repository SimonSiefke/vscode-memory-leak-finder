import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('File System Watcher Unique Patterns: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('File System Watcher Unique Patterns: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('File System Watcher Unique Patterns: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('File System Watcher Unique Patterns: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('File System Watcher Unique Patterns: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('File System Watcher Unique Patterns: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
