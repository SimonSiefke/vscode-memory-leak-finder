import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Unique Resource Source Menu Lifecycle: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Unique Resource Source Menu Lifecycle: setup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression:
        "Array.from(document.querySelectorAll('.notifications-list-container, .monaco-dialog-box')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Unique Resource Source Menu Lifecycle: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Unique Resource Source Menu Lifecycle: run complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression:
        "Array.from(document.querySelectorAll('.notifications-list-container, .monaco-dialog-box')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Unique Resource Source Menu Lifecycle: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Unique Resource Source Menu Lifecycle: cleanup complete')
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression:
        "Array.from(document.querySelectorAll('.notifications-list-container, .monaco-dialog-box')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}
