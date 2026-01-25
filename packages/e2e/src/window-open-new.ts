import type { TestContext } from '../types.ts'

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  // Get the count of windows before opening a new one
  const windowCountBefore = await Electron.getWindowCount()

  // Open a new VS Code window using the Workbench API
  await Workbench.openNewWindow()

  // Verify a new window was created
  const windowCountAfter = await Electron.getWindowCount()
  if (windowCountAfter <= windowCountBefore) {
    throw new Error('New window was not created')
  }
}

export const teardown = async ({ Electron }: TestContext): Promise<void> => {
  // Close all windows except the first one
  // This ensures we don't leave extra windows open after the test
  await Electron.evaluate(`(() => {
    const { BrowserWindow } = globalThis._____electron
    const allWindows = BrowserWindow.getAllWindows()
    // Keep only the first window open
    if (allWindows.length > 1) {
      for (let i = 1; i < allWindows.length; i++) {
        const window = allWindows[i]
        if (window && !window.isDestroyed()) {
          window.close()
        }
      }
    }
  })()`)

  // Give windows time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
