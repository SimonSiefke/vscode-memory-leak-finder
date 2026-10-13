const vscode = require('vscode')

let registration
let document
let armed = false
let complete
let fail
const setup = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc(' })
  const editor = await vscode.window.showTextDocument(document)
  editor.selection = new vscode.Selection(0, 3, 0, 3)
  registration = vscode.languages.registerWorkspaceSymbolProvider({
    async provideWorkspaceSymbols(_query, token) {
      if (!armed) return undefined
      armed = false
      let listener
      let timeout
      try {
        const canceled = new Promise((resolve, reject) => {
          listener = token.onCancellationRequested(resolve)
          timeout = setTimeout(() => reject(new Error('Provider cancellation was not delivered')), 5000)
        })
        await vscode.commands.executeCommand('workbench.action.closeQuickOpen')
        await canceled
        if (!token.isCancellationRequested) throw new Error('Result must be returned after cancellation')
        return [
          new vscode.SymbolInformation(
            'late symbol',
            vscode.SymbolKind.Function,
            '',
            new vscode.Location(document.uri, new vscode.Position(0, 0)),
          ),
        ]
      } catch (error) {
        fail(error)
        throw error
      } finally {
        clearTimeout(timeout)
        listener?.dispose()
        complete()
      }
    },
  })
}
const run = async () => {
  let timeout
  const completed = new Promise((resolve, reject) => {
    complete = resolve
    fail = reject
    timeout = setTimeout(() => reject(new Error('Provider was never invoked')), 7000)
  })
  try {
    armed = true
    await vscode.commands.executeCommand('workbench.action.quickOpen', '#lifecycle')
    await completed
    await vscode.commands.executeCommand('setContext', 'workspace-symbol-late-cancellation.finished', true)
  } finally {
    clearTimeout(timeout)
    armed = false
    complete = undefined
    fail = undefined
  }
}
const cleanup = async () => {
  registration?.dispose()
  registration = undefined
  document = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('workspace-symbol-late-cancellation.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('workspace-symbol-late-cancellation.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Workspace Symbol Late Cancellation: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('workspace-symbol-late-cancellation.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Workspace Symbol Late Cancellation: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('workspace-symbol-late-cancellation.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Workspace Symbol Late Cancellation: cleanup complete')
    }),
  )
}
