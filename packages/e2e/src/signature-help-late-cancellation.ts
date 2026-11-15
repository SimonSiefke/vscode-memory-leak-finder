import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Signature Help Late Cancellation: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Signature Help Late Cancellation: setup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Signature Help Late Cancellation: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Signature Help Late Cancellation: run complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Signature Help Late Cancellation: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Signature Help Late Cancellation: cleanup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}
