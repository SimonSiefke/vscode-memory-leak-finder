import type { TestContext } from '../types.ts'

export const skip = 1

const expression = 'counter'

export const setup = async ({ ActivityBar, Editor, Notification, QuickPick, RunAndDebug, Workspace }: TestContext): Promise<void> => {
  await Workspace.setFiles([
    {
      content: `let counter = 0
counter++
counter++
`,
      name: 'program.js',
    },
    {
      // A launch configuration selects the fixture debugger and keeps the Watch view visible between sessions.
      content: JSON.stringify(
        {
          configurations: [
            {
              internalConsoleOptions: 'neverOpen',
              name: 'Watch Inline',
              program: '${workspaceFolder}/program.js',
              request: 'launch',
              type: 'watch-inline',
            },
          ],
          version: '0.2.0',
        },
        null,
        2,
      ),
      name: '.vscode/launch.json',
    },
  ])
  await Editor.closeAll()
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Watch Expressions Inline Adapter: Setup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Watch Expressions Inline Adapter: setup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
  await ActivityBar.showRunAndDebug()
  await RunAndDebug.shouldHaveNoWatchExpressions()
}

export const run = async ({ Notification, QuickPick, RunAndDebug }: TestContext): Promise<void> => {
  await RunAndDebug.addWatchExpression(expression)
  await RunAndDebug.shouldHaveWatchExpression({ expression, value: 'not available' })
  let started = false
  try {
    await QuickPick.executeCommand('Debug: Start Debugging')
    started = true
    // With a single thread the Call Stack has no paused thread row, so the stop is identified by the
    // watch value: the adapter answers stop-<n> and verifies that the request carried stop n's frame id.
    await RunAndDebug.waitForPaused({ file: 'program.js', hasCallStack: false, line: 2 })
    await RunAndDebug.shouldHaveWatchExpression({ expression, value: 'stop-1' })
    await RunAndDebug.continue()
    await RunAndDebug.waitForPaused({ file: 'program.js', hasCallStack: false, line: 3 })
    await RunAndDebug.shouldHaveWatchExpression({ expression, value: 'stop-2' })
    await RunAndDebug.stop()
    started = false
  } finally {
    if (started) {
      await RunAndDebug.stop()
    }
  }
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Watch Expressions Inline Adapter: Verify Session')
    // The fixture checks that each stop got a watch evaluation for its own frame and none came after disconnect.
    await Notification.shouldHaveItem('Debug Watch Expressions Inline Adapter: verify complete (2 stops,')
  } finally {
    await Notification.closeAll({ force: true })
  }
  await RunAndDebug.shouldHaveWatchExpression({ expression, value: 'not available' })
  await RunAndDebug.removeAllWatchExpressions()
  await RunAndDebug.shouldHaveNoWatchExpressions()
}

export const teardown = async ({ Editor, Notification, QuickPick, SideBar, Workspace }: TestContext): Promise<void> => {
  await Notification.closeAll({ force: true })
  try {
    await QuickPick.executeCommand('Debug Watch Expressions Inline Adapter: Cleanup')
    // Selecting a command does not await its extension callback.
    await Notification.shouldHaveItem('Debug Watch Expressions Inline Adapter: cleanup complete')
  } finally {
    await Notification.closeAll({ force: true })
  }
  await Editor.closeAll()
  await SideBar.hide()
  await Workspace.setFiles([])
}
