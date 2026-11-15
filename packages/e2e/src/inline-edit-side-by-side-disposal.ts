import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Edit Side By Side Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Edit Side By Side Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Edit Side By Side Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Edit Side By Side Disposal: run complete')
    await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const check = () => {
        const editors = document.querySelectorAll('.monaco-editor');
        if (document.querySelector('.originalOverlaySideBySide') && editors.length > 1 && Array.from(editors).some(editor => editor.textContent?.includes('replacement'))) resolve(true);
        else if (Date.now() > deadline) reject(new Error('Inline edit preview editor did not render'));
        else setTimeout(check, 50);
      }; check();
    })`,
      awaitPromise: true,
    })
    await QuickPick.executeCommand('Dismiss Lifecycle Inline Edit')
    await Notification.shouldHaveItem('Lifecycle inline edit dismissed')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Inline Edit Side By Side Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Inline Edit Side By Side Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
