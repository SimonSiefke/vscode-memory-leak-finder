import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Auxiliary Editor Window Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Auxiliary Editor Window Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Editor, Electron }: TestContext): Promise<void> => {
  const original = await Electron.getWindowIds()
  const opened: number[] = []
  try {
    for (const file of ['first.txt']) {
      await Editor.open(file)
      await Editor.moveToNewWindow()
      const ids = await Electron.getWindowIds()
      const id = ids.find((value) => !original.includes(value) && !opened.includes(value))
      if (id === undefined) throw new Error('Auxiliary window was not created')
      opened.push(id)
      await Electron.evaluate(`globalThis.__lifecycleContents = globalThis._____electron.BrowserWindow.fromId(${id}).webContents.id`)
      const webContentsId = await Electron.evaluate('globalThis.__lifecycleContents')
      await Electron.evaluate('delete globalThis.__lifecycleContents')
      await Electron.executeJavaScriptInWebContents({
        webContentsId,
        expression: `new Promise((resolve, reject) => {
        const deadline = Date.now() + 7000;
        const check = () => {
          const text = document.querySelector('.view-lines')?.textContent || '';
          if (text.includes('Rendered') && text.includes('auxiliary') && text.includes('editor')) {
            document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))));
          } else if (Date.now() > deadline) reject(new Error('Auxiliary editor did not render: ' + document.body.textContent?.slice(0, 800)));
          else requestAnimationFrame(check);
        }; check();
      })`,
      })
    }
    // Both windows have initialized before the first close in the two-window case.
    for (const [index, id] of opened.entries()) {
      await Electron.closeWindow(id)
      await Electron.waitForWindowCount(original.length + opened.length - index - 1)
    }
  } finally {
    for (const id of opened) await Electron.closeWindow(id)
    await Electron.waitForWindowCount(original.length)
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Auxiliary Editor Window Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Auxiliary Editor Window Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
