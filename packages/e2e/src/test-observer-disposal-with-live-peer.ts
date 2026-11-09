import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Observer Disposal With Live Peer: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Test Observer Disposal With Live Peer: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Observer Disposal With Live Peer: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Test Observer Disposal With Live Peer: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Test Observer Disposal With Live Peer: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Test Observer Disposal With Live Peer: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
