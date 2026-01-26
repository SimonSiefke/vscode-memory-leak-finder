import type { TestContext } from '../types.ts'

export const skip = 1

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()

  // Wait for the new window's workbench to be visible
  const workbenchLocator = {
    objectType: 'locator',
    rpc: newWindow.sessionRpc,
    sessionRpc: newWindow.sessionRpc,
    selector: '.monaco-workbench',
  }
  // Use a simple polling approach to wait for the workbench
  let maxAttempts = 300 // 30 seconds with 100ms intervals
  let attempts = 0
  while (attempts < maxAttempts) {
    try {
      const isVisible = await newWindow.sessionRpc.rpc.invoke('test.isVisible', workbenchLocator)
      if (isVisible) {
        break
      }
    } catch {
      // Ignore errors during polling
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }

  if (attempts === maxAttempts) {
    throw new Error('Timeout: workbench did not become visible in new window')
  }

  // Close the window
  await newWindow.close()
}
