import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()

  // Wait for the new window's workbench to be visible instead of fixed timeout
  await newWindow.shouldBeVisible()

  // Close the window
  await newWindow.close()
}
