import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Console Link Output Replacement: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Console Link Output Replacement: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, DebugConsole, Workbench }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Console Link Output Replacement: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Console Link Output Replacement: run complete')
    const linked = await Workbench.evaluate({
      expression: `new Promise((resolve, reject) => {
      const deadline = Date.now() + 5000;
      const check = () => {
        if (Array.from(document.querySelectorAll('.repl a')).some(node => node.textContent?.includes('linked-source.js'))) resolve(true);
        else if (Date.now() > deadline) reject(new Error('Debug output was not linkified'));
        else setTimeout(check, 50);
      }; check();
    })`,
      awaitPromise: true,
    })
    if (!linked) throw new Error('Debug output link missing')
    await DebugConsole.clear()
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Console Link Output Replacement: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Console Link Output Replacement: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
