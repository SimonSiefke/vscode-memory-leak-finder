import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Editor Decoration Type Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Editor Decoration Type Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Editor Decoration Type Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Editor Decoration Type Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Editor Decoration Type Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Editor Decoration Type Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
