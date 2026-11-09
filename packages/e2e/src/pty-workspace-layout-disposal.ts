import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Pty Workspace Layout Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Pty Workspace Layout Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

let iteration = 0
export const run = async ({ Workbench, Electron }: TestContext): Promise<void> => {
  const directory = join(import.meta.dirname, '../../..', '.vscode-test-workspace', `layout-${++iteration}`)
  await mkdir(directory, { recursive: true })
  const count = await Electron.getWindowCount()
  const window = await Workbench.openNewWindow()
  try {
    await window.shouldBeVisible()
    await Electron.mockOpenDialog({ canceled: false, filePaths: [directory] })
    await window.QuickPick.executeCommand('Workspaces: Add Folder to Workspace...')
    await window.QuickPick.executeCommand('View: Show Explorer')
    await window.Explorer.shouldHaveItem(`layout-${iteration}`)
    await window.Terminal.show({ waitForReady: true })
    await window.Terminal.execute('printf layout-lifecycle')
    await window.Terminal.shouldContainText('layout-lifecycle')
    await window.Terminal.killAll()
    await window.waitForIdle()
    const remaining = await window.evaluate({ expression: "document.querySelectorAll('.terminal-instance').length" })
    if (remaining !== 0) throw new Error('Terminal instances remain in closing workspace')
  } finally {
    await Electron.unmockElectron('dialog', 'showOpenDialog')
    await window.closeGracefully()
    await Electron.waitForWindowCount(count)
    await rm(directory, { recursive: true, force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Pty Workspace Layout Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Pty Workspace Layout Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
