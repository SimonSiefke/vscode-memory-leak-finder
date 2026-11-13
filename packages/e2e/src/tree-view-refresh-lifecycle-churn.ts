import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Tree View Refresh Lifecycle Churn: Setup')
    await Notification.shouldHaveItem('Tree View Refresh Lifecycle Churn: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Tree View Refresh Lifecycle Churn: Run')
    await Notification.shouldHaveItem('Tree View Refresh Lifecycle Churn: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Tree View Refresh Lifecycle Churn: Cleanup')
    await Notification.shouldHaveItem('Tree View Refresh Lifecycle Churn: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
