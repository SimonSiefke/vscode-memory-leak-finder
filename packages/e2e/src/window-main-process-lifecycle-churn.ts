import type { TestContext } from '../types.ts'

export const skip = true

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()
  try {
    await newWindow.shouldBeVisible()
    await newWindow.waitForIdle()
  } finally {
    await newWindow.closeGracefully()
  }
}
