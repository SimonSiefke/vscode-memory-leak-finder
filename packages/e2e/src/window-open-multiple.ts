import type { TestContext } from '../types.ts'

/**
 * Multi-window test demonstrating:
 * 1. Opening multiple VS Code windows using the Workbench API
 * 2. Verifying windows were created
 * 3. Proper cleanup
 *
 * Note: Each new window opens with its own VS Code instance.
 * The test currently runs in the first window only.
 */
export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  // Get initial window count
  const initialCount = await Electron.getWindowCount()

  // Open the first new window
  await Workbench.openNewWindow()

  // Open the second new window
  await Workbench.openNewWindow()

  // Verify both windows were created
  const finalCount = await Electron.getWindowCount()
  if (finalCount < initialCount + 2) {
    throw new Error(`Expected at least ${initialCount + 2} windows, got ${finalCount}`)
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
