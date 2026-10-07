import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    // This command affects only the dedicated test profile.
    await QuickPick.executeCommand('Extensions: Enable All Extensions')
    await QuickPick.executeCommand('Notebook Linkifier Repeat And Close: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Linkifier Repeat And Close: setup complete')
  } catch (error) {
    const detail = await Workbench.evaluate({
      expression:
        "document.querySelector('.notifications-list-container')?.textContent || document.querySelector('.notifications-toasts')?.textContent",
    })
    throw new Error(`${String(error)}; ${detail}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Linkifier Repeat And Close: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Linkifier Repeat And Close: run complete')
    await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 7000;
      const check = () => {
        const links = Array.from(document.querySelectorAll('.interactive-response a[data-href^="vscode-notebook-cell:"]')).filter(link => link.textContent?.includes('cell 1'));
        if (links.length === 2) resolve(true);
        else if (Date.now() > deadline) reject(new Error('NotebookCellLinkifier did not render the two cell links: ' + Array.from(document.querySelectorAll('.interactive-response')).map(node => node.textContent?.slice(-1000)).join(' | ')));
        else setTimeout(check, 50);
      }; check();
    })`,
      awaitPromise: true,
    })
    await QuickPick.executeCommand('Close Linkifier Notebook')
    await Notification.shouldHaveItem('Linkifier notebook closed')
  } catch (error) {
    const detail = await Workbench.evaluate({
      expression:
        "document.querySelector('.notifications-list-container')?.textContent || document.querySelector('.notifications-toasts')?.textContent",
    })
    throw new Error(`${String(error)}; ${detail}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Linkifier Repeat And Close: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Linkifier Repeat And Close: cleanup complete')
  } catch (error) {
    const detail = await Workbench.evaluate({
      expression:
        "document.querySelector('.notifications-list-container')?.textContent || document.querySelector('.notifications-toasts')?.textContent",
    })
    throw new Error(`${String(error)}; ${detail}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}
