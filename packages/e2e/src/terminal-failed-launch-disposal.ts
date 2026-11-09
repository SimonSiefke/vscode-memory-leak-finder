import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Failed Launch Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Failed Launch Disposal: setup complete')
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

let completed = 0

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Terminal Failed Launch Disposal: Run')
    // Selecting a command does not await its extension callback.
    const expected = `Failed terminal launch completed ${++completed}`
    await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 7000;
      const check = () => {
        if (Array.from(document.querySelectorAll('.statusbar-item')).some(item => item.textContent?.includes(${JSON.stringify(expected)}))) resolve(true);
        else if (Date.now() > deadline) reject(new Error('Failed launch lifecycle completion missing'));
        else setTimeout(check, 50);
      }; check();
    })`,
      awaitPromise: true,
    })
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
    await QuickPick.executeCommand('Terminal Failed Launch Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Terminal Failed Launch Disposal: cleanup complete')
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
