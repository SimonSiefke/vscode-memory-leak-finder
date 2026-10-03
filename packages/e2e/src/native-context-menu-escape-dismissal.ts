import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Native Context Menu Escape Dismissal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Native Context Menu Escape Dismissal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  await Electron.evaluate(`(() => {
    const prototype = globalThis._____electron.Menu.prototype;
    globalThis.__nativeMenuLifecycle = { original: prototype.popup, closed: false, shown: false };
    prototype.popup = function(options) {
      const state = globalThis.__nativeMenuLifecycle;
      this.once('menu-will-close', () => { state.closed = true; });
      this.once('menu-will-show', () => {
        state.shown = true;
        try { (globalThis._____require || globalThis.___require)('node:child_process').execFile('xdotool', ['key', 'Escape'], error => { if (error) state.error = String(error); }); } catch (error) { state.error = String(error); }
      });
      return state.original.call(this, options);
    };
  })()`)
  try {
    await Workbench.evaluate({
      expression: `(() => {
      const tab = document.querySelector('.tabs-container .tab.active');
      if (!tab) throw new Error('Editor tab missing');
      const rect = tab.getBoundingClientRect();
      tab.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: rect.left + 10, clientY: rect.top + 10 }));
    })()`,
    })
    const deadline = Date.now() + 7000
    let closed = false
    while (Date.now() < deadline) {
      const state = (await Electron.evaluate(
        '({ shown: globalThis.__nativeMenuLifecycle.shown, closed: globalThis.__nativeMenuLifecycle.closed, error: globalThis.__nativeMenuLifecycle.error })',
      )) as { shown: boolean; closed: boolean; error?: string }
      if (state.error) throw new Error(state.error)
      if (state.shown && state.closed) {
        closed = true
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
    if (!closed) throw new Error('Native menu did not close through native Escape input')
  } finally {
    await Electron.evaluate(
      'globalThis._____electron.Menu.prototype.popup = globalThis.__nativeMenuLifecycle.original; delete globalThis.__nativeMenuLifecycle',
    )
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Native Context Menu Escape Dismissal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Native Context Menu Escape Dismissal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
