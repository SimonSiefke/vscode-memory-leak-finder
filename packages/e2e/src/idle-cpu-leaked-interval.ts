import type { TestContext } from '../types.ts'

// Opt-in positive control for idle-cpu-after-scenario; it burns CPU on purpose.
export const skip = 1
export const skipInCi = true

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Idle CPU Leaked Interval: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Idle CPU Leaked Interval: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Idle CPU Leaked Interval: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Idle CPU Leaked Interval: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
