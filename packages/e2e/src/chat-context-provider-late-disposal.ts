import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Context Provider Late Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Context Provider Late Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Context Provider Late Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Context Provider Late Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Chat Context Provider Late Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Chat Context Provider Late Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
