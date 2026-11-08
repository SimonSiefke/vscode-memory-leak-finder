import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Codelens Provider Command Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Codelens Provider Command Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Codelens Provider Command Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Codelens Provider Command Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Codelens Provider Command Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Codelens Provider Command Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
