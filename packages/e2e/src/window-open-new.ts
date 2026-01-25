import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Electron, Workbench }: TestContext): Promise<void> => {
  // Get the count of windows before opening a new one
  const windowCountBefore = await Electron.getWindowCount()

  // Open a new VS Code window using the Workbench API
  const newWindow = await Workbench.openNewWindow()

  // Verify a new window was created
  let windowCountAfter = await Electron.getWindowCount()
  if (windowCountAfter <= windowCountBefore) {
    throw new Error('New window was not created')
  }

  // Wait for the new window to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Close the window
  await newWindow.close()

  // Give the window time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Verify we're back to the original state
  windowCountAfter = await Electron.getWindowCount()
  if (windowCountAfter !== windowCountBefore) {
    throw new Error(`Window count should be ${windowCountBefore}, but got ${windowCountAfter}`)
  }
}
