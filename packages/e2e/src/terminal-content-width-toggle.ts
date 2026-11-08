import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Terminal }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Content Width Toggle: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Content Width Toggle: setup complete')
    await Terminal.execute("printf '%0500d\\n' 0")
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Content Width Toggle: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Content Width Toggle: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Content Width Toggle: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Content Width Toggle: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
