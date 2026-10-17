import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Scm Artifact Late Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Scm Artifact Late Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Scm Artifact Late Disposal: Run')
    await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const check = () => {
        if (document.querySelector('.notifications-toasts')?.textContent?.includes('Scm Artifact Late Disposal: run complete')) { resolve(true); return; }
        const row = Array.from(document.querySelectorAll('.monaco-list-row')).find(node => node.textContent?.includes('Lifecycle artifact group'));
        if (row) { row.querySelector('.monaco-tl-twistie')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); resolve(true); }
        else if (Date.now() > deadline) reject(new Error('Artifact group did not render: ' + document.querySelector('.scm-repositories-view')?.textContent));
        else { const repository = Array.from(document.querySelectorAll('.monaco-list-row[aria-expanded="false"]')).find(node => node.textContent?.includes('Lifecycle artifacts')); repository?.querySelector('.monaco-tl-twistie')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); setTimeout(check, 50); }
      }; check();
    })`,
      awaitPromise: true,
    })
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Scm Artifact Late Disposal: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Scm Artifact Late Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Scm Artifact Late Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
