import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Problems }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Problems Linked Diagnostic Replacement: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Problems Linked Diagnostic Replacement: setup complete')
    await Problems.show()
    await Problems.switchToTableView()
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Problems }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Problems Linked Diagnostic Replacement: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Problems Linked Diagnostic Replacement: run complete')
    await Problems.shouldHaveCount(1)
    await QuickPick.executeCommand('Linked Diagnostic: Clear')
    await Problems.shouldHaveCount(0)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Problems Linked Diagnostic Replacement: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Problems Linked Diagnostic Replacement: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
