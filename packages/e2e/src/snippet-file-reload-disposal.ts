import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Snippet File Reload Disposal: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Snippet File Reload Disposal: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

let version = 0

export const run = async ({ Notification, QuickPick, Editor }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Snippet File Reload Disposal: Run')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Snippet File Reload Disposal: run complete')
    await Notification.closeAll({ force: true })
    const current = ++version
    // Opening the picker asks the snippet service to finish loading changed files.
    await QuickPick.executeCommand('Snippets: Insert Snippet', { stayVisible: true })
    await QuickPick.select(`lifecycle${current}`)
    await Editor.shouldHaveText(`lifecycle body ${current}`)
    await Editor.selectAll()
    await Editor.deleteAll()
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Snippet File Reload Disposal: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Snippet File Reload Disposal: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}
