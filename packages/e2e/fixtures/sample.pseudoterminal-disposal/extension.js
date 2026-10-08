const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

const run = async () => {
  const write = new vscode.EventEmitter()
  let terminal
  let listener
  let timeout
  const closed = new Promise((resolve, reject) => {
    listener = vscode.window.onDidCloseTerminal((value) => {
      if (value === terminal) resolve()
    })
    timeout = setTimeout(() => reject(new Error('Pseudoterminal did not close')), 5000)
  })
  try {
    terminal = vscode.window.createTerminal({ name: 'Temporary pseudoterminal', pty: { onDidWrite: write.event, open() {}, close() {} } })
    terminal.dispose()
    await closed
  } finally {
    clearTimeout(timeout)
    listener.dispose()
    terminal?.dispose()
    write.dispose()
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('pseudoterminal-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('pseudoterminal-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Pseudoterminal Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('pseudoterminal-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Pseudoterminal Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('pseudoterminal-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Pseudoterminal Disposal: cleanup complete')
    }),
  )
}
