const vscode = require('vscode')

let provider
let changed
let entered
let release
let armed = false
const setup = () => {
  changed = new vscode.EventEmitter()
  provider = vscode.languages.registerInlayHintsProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      onDidChangeInlayHints: changed.event,
      provideInlayHints(_document, _range, token) {
        if (!armed) return []
        armed = false
        const pending = new Promise((resolve) => {
          release = () => resolve([new vscode.InlayHint(new vscode.Position(0, 1), 'late hint')])
        })
        entered(token)
        return pending
      },
    },
  )
}
const run = async () => {
  let timeout
  let listener
  const pending = new Promise((resolve, reject) => {
    entered = resolve
    timeout = setTimeout(() => reject(new Error('Inlay hint request was not entered')), 7000)
  })
  try {
    armed = true
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' }))
    const token = await pending
    clearTimeout(timeout)
    const canceled = new Promise((resolve, reject) => {
      if (token.isCancellationRequested) resolve()
      else listener = token.onCancellationRequested(resolve)
      timeout = setTimeout(() => reject(new Error('Pending inlay hint request was not canceled')), 5000)
    })
    changed.fire()
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
    await canceled
    release()
    await vscode.commands.executeCommand('setContext', 'inlay-hints-pending-refresh-disposal.closed', true)
  } finally {
    clearTimeout(timeout)
    listener?.dispose()
    release?.()
    release = undefined
    entered = undefined
    armed = false
  }
}
const cleanup = () => {
  provider?.dispose()
  provider = undefined
  changed?.dispose()
  changed = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('inlay-hints-pending-refresh-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hints-pending-refresh-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Inlay Hints Pending Refresh Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hints-pending-refresh-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Inlay Hints Pending Refresh Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hints-pending-refresh-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Inlay Hints Pending Refresh Disposal: cleanup complete')
    }),
  )
}
