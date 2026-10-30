import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Detach Reattach Lifecycle: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Detach Reattach Lifecycle: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Terminal }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Detach Reattach Lifecycle: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Detach Reattach Lifecycle: run complete')
    await QuickPick.executeCommand('Terminal: Attach to Session', { stayVisible: true })
    await QuickPick.select('Persistent lifecycle terminal')
    await QuickPick.executeCommand('Verify Persistent Terminal Identity')
    await Notification.shouldHaveItem('Persistent terminal identity verified')
    await Terminal.shouldContainText('persistent-lifecycle-output')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Detach Reattach Lifecycle: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Detach Reattach Lifecycle: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
