import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()
  await newWindow.shouldBeVisible()
  await newWindow.close()
}
