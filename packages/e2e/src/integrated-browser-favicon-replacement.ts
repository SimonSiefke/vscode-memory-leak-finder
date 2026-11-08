import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick, SimpleBrowser }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Favicon Replacement: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Favicon Replacement: setup complete')
    await SimpleBrowser.showModern({ url: 'http://127.0.0.1:49231' })
  } finally {
    await Notification.closeAll({ force: true })
  }
}

let iteration = 0

export const run = async ({ Notification, QuickPick, SimpleBrowser }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Integrated Browser Favicon Replacement: Run')
    await SimpleBrowser.executeJavaScript({
      expression: `(() => {
      document.querySelector('link[rel="icon"]')?.remove();
      const link = document.createElement('link'); link.rel = 'icon'; link.href = '/icon-${++iteration}.png'; document.head.append(link);
    })()`,
    })
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Favicon Replacement: run complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick, Editor }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await Editor.closeAll()
    await QuickPick.executeCommand('Integrated Browser Favicon Replacement: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Integrated Browser Favicon Replacement: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
