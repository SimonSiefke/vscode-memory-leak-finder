import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Status Provider Host Restart: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Status Provider Host Restart: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notification, QuickPick, Workbench }: TestContext): Promise<void> => {
  const before = await Workbench.evaluate({
    expression:
      "Array.from(document.querySelectorAll('.statusbar-item')).map(item => item.textContent).find(text => text?.includes('Lifecycle host '))",
  })
  if (!before) throw new Error('Initial fixture host is not ready')
  await QuickPick.executeCommand('Notebook Status Provider Host Restart: Run')
  const deadline = Date.now() + 15000
  let restarted = false
  while (Date.now() < deadline) {
    const after = await Workbench.evaluate({
      expression:
        "Array.from(document.querySelectorAll('.statusbar-item')).map(item => item.textContent).find(text => text?.includes('Lifecycle host '))",
    })
    if (after && after !== before) {
      restarted = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!restarted) throw new Error('A new extension host did not become ready')
  await QuickPick.executeCommand('Notebook Status Provider Host Restart: Setup')
  await Notification.shouldHaveItem('Notebook Status Provider Host Restart: setup complete')
  await Notification.closeAll({ force: true })
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Status Provider Host Restart: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Status Provider Host Restart: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
