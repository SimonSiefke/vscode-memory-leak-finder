import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Auto Reply Removal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Auto Reply Removal: setup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

let iteration = 0
export const run = async ({ Notification, QuickPick, Workbench, Terminal }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Auto Reply Removal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Auto Reply Removal: run complete')
    try {
      await Terminal.shouldContainText(`REPLY_RESULT_${++iteration}:NO_REPLY`)
    } finally {
      await QuickPick.executeCommand('Close Auto Reply Terminal')
      await Notification.shouldHaveItem('Auto reply terminal closed')
    }
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
    await QuickPick.executeCommand('Terminal Auto Reply Removal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Auto Reply Removal: cleanup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notification-list-item')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}
