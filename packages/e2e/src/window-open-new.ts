import type { TestContext } from '../types.ts'

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  // Get the count of windows before opening a new one
  const windowCountBefore = await Electron.getWindowCount()

  // Open a new VS Code window using the Workbench API
  await Workbench.openNewWindow()

  // Wait for the new window to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Close all windows except the first one to clean up after ourselves
  await Electron.evaluate(`(() => {
    const { BrowserWindow } = globalThis._____electron
    const allWindows = BrowserWindow.getAllWindows()
    if (allWindows.length > 1) {
      for (let i = 1; i < allWindows.length; i++) {
        const window = allWindows[i]
        if (window && !window.isDestroyed()) {
          window.close()
        }
      }
    }
  })()`)

  // Verify we're back to the original state
  const windowCountAfter = await Electron.getWindowCount()
  if (windowCountAfter !== windowCountBefore) {
    throw new Error(`Window count should be ${windowCountBefore}, but got ${windowCountAfter}`)
  }
}
