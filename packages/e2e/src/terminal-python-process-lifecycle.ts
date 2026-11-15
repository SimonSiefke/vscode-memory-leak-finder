import type { TestContext } from '../types.ts'

// Requires --enable-extensions and a Python interpreter on PATH.
export const skip = 1

const execute = async ({ Notification, QuickPick, Workbench }: TestContext, stage: string): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand(`Python Terminal Process Lifecycle: ${stage}`)
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem(`Python Terminal Process Lifecycle: ${stage.toLowerCase()} complete`)
  } catch (error) {
    const notifications = await Workbench.evaluate({
      expression: "Array.from(document.querySelectorAll('.notifications-list-container')).map(item => item.textContent).join(' | ')",
    })
    throw new Error(`${String(error)}; notifications: ${JSON.stringify(notifications)}`)
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const setup = async (context: TestContext): Promise<void> => {
  await context.Terminal.killAll()
  await execute(context, 'Setup')
}

export const run = async (context: TestContext): Promise<void> => {
  await execute(context, 'Run')
  await context.Panel.hide()
}

export const teardown = async (context: TestContext): Promise<void> => {
  try {
    await execute(context, 'Cleanup')
  } finally {
    await context.Terminal.killAll()
    await context.Panel.hide()
  }
}
