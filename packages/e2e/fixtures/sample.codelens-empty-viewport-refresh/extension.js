const vscode = require('vscode')

let provider
let changed
let empty = false
let observed
const setup = async () => {
  changed = new vscode.EventEmitter()
  provider = vscode.languages.registerCodeLensProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      onDidChangeCodeLenses: changed.event,
      provideCodeLenses() {
        if (empty) {
          observed?.()
          return []
        }
        return [new vscode.CodeLens(new vscode.Range(0, 0, 0, 3))]
      },
      resolveCodeLens(lens) {
        lens.command = { command: 'codelens-empty-viewport-refresh.noop', title: 'Lifecycle lens' }
        observed?.()
        return lens
      },
    },
  )
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' }))
}
const run = async () => {
  for (const nextEmpty of [false, true]) {
    let timeout
    const completed = new Promise((resolve, reject) => {
      observed = resolve
      timeout = setTimeout(() => reject(new Error('CodeLens refresh did not complete')), 6000)
    })
    try {
      empty = nextEmpty
      changed.fire()
      await completed
    } finally {
      clearTimeout(timeout)
      observed = undefined
    }
    await vscode.commands.executeCommand('setContext', 'codelens-empty-viewport-refresh.empty', nextEmpty)
  }
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  changed?.dispose()
  changed = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('codelens-empty-viewport-refresh.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-empty-viewport-refresh.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Codelens Empty Viewport Refresh: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-empty-viewport-refresh.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Codelens Empty Viewport Refresh: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-empty-viewport-refresh.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Codelens Empty Viewport Refresh: cleanup complete')
    }),
  )
}
