import type { TestContext } from '../types.ts'

export const skip = 1

export const setup = async ({ Editor, Notebook, Notification, QuickPick }: TestContext): Promise<void> => {
  await Editor.closeAll()
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Controller Execution Interrupt: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Controller Execution Interrupt: setup complete')
    await Notebook.shouldHaveKernel('Interrupt Fixture Kernel')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const run = async ({ Notebook, Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    // The fixture kernel writes this output and then blocks until the execution token is cancelled.
    await Notebook.executeCell({ expectedOutput: 'stream: first chunk', index: 0 })
    await Notebook.stopCellExecution(0)
    await Notification.shouldHaveItem('Notebook Controller Execution Interrupt: interrupt observed')
    await Notification.closeAll({ force: true })
    await Notebook.shouldHaveCellExecutionState({ index: 0, state: 'error' })

    await Notebook.executeCell({ expectedOutput: 'completed', index: 0 })
    await Notebook.shouldHaveCellExecutionState({ index: 0, state: 'success' })
    await Notebook.shouldHaveKernel('Interrupt Fixture Kernel')

    await Notebook.clearAllOutputs()
    // Reset fails unless this cycle saw one interrupt, one completion, no pending execution and no outputs.
    await QuickPick.executeCommand('Notebook Controller Execution Interrupt: Reset')
    await Notification.shouldHaveItem('Notebook Controller Execution Interrupt: reset complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
}

export const teardown = async ({ Editor, Notification, QuickPick }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Notebook Controller Execution Interrupt: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Notebook Controller Execution Interrupt: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
    await Editor.closeAll()
  }
}
