const vscode = require('vscode')

let status
let completed = 0
let anchor
const setup = () => {
  status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000)
  status.show()
  anchor = vscode.window.createTerminal({ name: 'Live terminal anchor' })
}
const run = async () => {
  let terminal
  let listener
  let timeout
  const closed = new Promise((resolve, reject) => {
    listener = vscode.window.onDidCloseTerminal((value) => {
      if (value === terminal) resolve()
    })
    timeout = setTimeout(() => reject(new Error('Failed terminal launch did not close')), 5000)
  })
  try {
    terminal = vscode.window.createTerminal({ name: 'Expected failed launch', shellPath: '/nonexistent/lifecycle-fixture-shell' })
    await closed
    status.text = `Failed terminal launch completed ${++completed}`
  } finally {
    clearTimeout(timeout)
    listener.dispose()
    terminal?.dispose()
  }
}
const cleanup = () => {
  status?.dispose()
  status = undefined
  anchor?.dispose()
  anchor = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-failed-launch-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-failed-launch-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Failed Launch Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-failed-launch-disposal.run', async () => {
      try {
        await run()
      } catch (error) {
        void vscode.window.showInformationMessage(String(error))
        throw error
      }
      void vscode.window.showInformationMessage('Terminal Failed Launch Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-failed-launch-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Failed Launch Disposal: cleanup complete')
    }),
  )
}
