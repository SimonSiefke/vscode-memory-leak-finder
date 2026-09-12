import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.mockDialog({ response: 0 })
}

export const run = async ({ Workbench }: TestContext): Promise<void> => {
  const newWindow = await Workbench.openNewWindow()
  try {
    await newWindow.shouldBeVisible()
    await newWindow.QuickPick.executeCommand('Help: About')
    await newWindow.waitForIdle()
    await new Promise((resolve) => setTimeout(resolve, 500))
  } finally {
    await newWindow.closeGracefully()
  }
}

export const teardown = async ({ Electron }: TestContext): Promise<void> => {
  await Electron.unmockElectron('dialog', 'showMessageBox')
}
