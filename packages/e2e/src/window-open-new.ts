import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()

  // TODO avoid fixed timeouts

  // Wait for the new window to be ready
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Close the window
  await newWindow.close()

  // Give the window time to close
  await new Promise((resolve) => setTimeout(resolve, 1000))
}
