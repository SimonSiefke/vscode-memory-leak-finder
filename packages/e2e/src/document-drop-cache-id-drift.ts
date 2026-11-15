import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Drop Cache Id Drift: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Drop Cache Id Drift: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Drop Cache Id Drift: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Drop Cache Id Drift: run complete')
    await Notification.closeAll({ force: true })
    for (let index = 0; index < 3; index++) {
      await Workbench.evaluate({
        expression: `(() => {
        const target = document.querySelector('.view-lines');
        if (!target) throw new Error('Drop target editor is missing');
        const rect = target.getBoundingClientRect();
        const dataTransfer = new DataTransfer(); dataTransfer.setData('text/plain', 'declined lifecycle drop');
        target.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer, shiftKey: true, clientX: rect.left + 8, clientY: rect.top + 8 }));
      })()`,
      })
      // A command round trip drains each input operation before the next transfer.
      await QuickPick.executeCommand('View: Focus Active Editor Group')
    }
    await QuickPick.executeCommand('Verify Accepted Lifecycle Drop')
    await Notification.shouldHaveItem('Accepted lifecycle drop verified')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Document Drop Cache Id Drift: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Document Drop Cache Id Drift: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
