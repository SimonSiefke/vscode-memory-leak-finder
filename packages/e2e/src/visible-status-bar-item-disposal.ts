import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Visible Status Bar Item Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Visible Status Bar Item Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Visible Status Bar Item Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Visible Status Bar Item Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Visible Status Bar Item Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Visible Status Bar Item Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
