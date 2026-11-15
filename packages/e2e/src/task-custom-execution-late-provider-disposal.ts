import type { TestContext } from '../types.ts'

// Opt-in: requires the fixture extension and extension-host heap inspection; see its README.
export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Custom Execution Late Provider Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Custom Execution Late Provider Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Custom Execution Late Provider Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Custom Execution Late Provider Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Task Custom Execution Late Provider Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Task Custom Execution Late Provider Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
