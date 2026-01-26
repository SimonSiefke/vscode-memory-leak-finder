import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()

  // Wait for the new window's workbench to be visible
  const workbenchLocator = newWindow.sessionRpc.locator('.monaco-workbench')
  await newWindow.sessionRpc.expect(workbenchLocator).toBeVisible()

  // Close the window
  await newWindow.close()
}
