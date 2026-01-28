import type { TestContext } from '../types.ts'

export const skip = 1

export const requiresNetwork = 1

export const run = async ({ Developer, Electron }: TestContext): Promise<void> => {
  // Get window count before opening process explorer
  const windowCountBefore = await Electron.getWindowCount()

  // Toggle process explorer (opens it)
  await Developer.toggleProcessExplorer()

  // Wait for process explorer window to appear
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Verify a new window was created
  const windowCountAfter = await Electron.getWindowCount()
  if (windowCountAfter <= windowCountBefore) {
    throw new Error(`Process explorer window was not created. Before: ${windowCountBefore}, After: ${windowCountAfter}`)
  }

  // Close the process explorer window by toggling it again
  await Developer.toggleProcessExplorer()

  // Give the window time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
