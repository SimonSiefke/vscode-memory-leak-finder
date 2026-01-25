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
  const window1 = await Workbench.openNewWindow()
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Open the second new window
  const window2 = await Workbench.openNewWindow()
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Verify both windows were created
  let finalCount = await Electron.getWindowCount()
  if (finalCount < initialCount + 2) {
    throw new Error(`Expected at least ${initialCount + 2} windows, got ${finalCount}`)
  }

  // Close both windows
  await window1.close()
  await window2.close()

  // Give windows time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Verify we're back to the initial state
  finalCount = await Electron.getWindowCount()
  if (finalCount !== initialCount) {
    throw new Error(`Window count should be ${initialCount}, but got ${finalCount}`)
  }
}
