import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Visualization Session Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Visualization Session Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Visualization Session Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Visualization Session Disposal: run complete')
    await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 7000;
      const check = () => {
        const action = document.querySelector('.debug-variables .debug-viz-icon');
        if (document.querySelector('.debug-variables')?.textContent?.includes('Lifecycle tree')) resolve(true);
        else if (action) { action.click(); resolve(true); }
        else if (Date.now() > deadline) reject(new Error('Debug visualizer action did not render: ' + document.querySelector('.debug-variables')?.textContent));
        else { const scope = Array.from(document.querySelectorAll('.debug-variables .monaco-list-row[aria-expanded="false"]')).find(row => row.textContent?.includes('Local')); scope?.querySelector('.monaco-tl-twistie')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); setTimeout(check, 50); }
      }; check();
    })`,
      awaitPromise: true,
    })
    await Notification.shouldHaveItem('Lifecycle tree requested')
    await QuickPick.executeCommand('Stop Lifecycle Debug Session')
    await Notification.shouldHaveItem('Lifecycle debug session stopped')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Visualization Session Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Visualization Session Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
