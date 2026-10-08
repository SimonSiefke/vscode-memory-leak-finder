import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Kernel Source Command Refresh: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Kernel Source Command Refresh: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Kernel Source Command Refresh: Run', { stayVisible: 'dont-care' })
    const commands = await QuickPick.getVisibleCommands()
    if (commands.some((command) => command.includes('Select Another Kernel'))) await QuickPick.select('Select Another Kernel...', true)
    await QuickPick.select('Lifecycle Kernel Source', 'dont-care')
    await Notification.shouldHaveItem('Kernel source command executed')
    await QuickPick.hide()
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Kernel Source Command Refresh: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Kernel Source Command Refresh: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Kernel Source Command Refresh: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
