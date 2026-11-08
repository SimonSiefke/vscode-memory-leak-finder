const vscode = require('vscode')

let registration
let previousSetting
let armed = false
let complete
let fail
const setup = async () => {
  previousSetting = vscode.workspace.getConfiguration('editor').inspect('semanticHighlighting.enabled')?.workspaceValue
  await vscode.workspace.getConfiguration('editor').update('semanticHighlighting.enabled', true, vscode.ConfigurationTarget.Workspace)
  registration = vscode.languages.registerDocumentSemanticTokensProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      async provideDocumentSemanticTokens(_document, token) {
        if (!armed) return undefined
        armed = false
        const resolve = complete
        const reject = fail
        let listener
        let timeout
        try {
          const canceled = new Promise((done, failCancel) => {
            listener = token.onCancellationRequested(done)
            timeout = setTimeout(() => failCancel(new Error('Semantic token request did not cancel')), 5000)
          })
          await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
          await canceled
          if (!token.isCancellationRequested) throw new Error('Expected canceled semantic token request')
          return new vscode.SemanticTokens(new Uint32Array(5000))
        } catch (error) {
          reject(error)
          throw error
        } finally {
          clearTimeout(timeout)
          listener?.dispose()
          resolve()
        }
      },
    },
    new vscode.SemanticTokensLegend(['variable']),
  )
}
const run = async () => {
  let timeout
  const completed = new Promise((resolve, reject) => {
    complete = resolve
    fail = reject
    timeout = setTimeout(() => reject(new Error('Semantic token provider was never invoked')), 7000)
  })
  try {
    armed = true
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'semantic' }))
    await completed
    await vscode.commands.executeCommand('setContext', 'semantic-tokens-late-cancellation.finished', true)
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
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  await vscode.workspace
    .getConfiguration('editor')
    .update('semanticHighlighting.enabled', previousSetting, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('semantic-tokens-late-cancellation.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('semantic-tokens-late-cancellation.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Semantic Tokens Late Cancellation: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('semantic-tokens-late-cancellation.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Semantic Tokens Late Cancellation: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('semantic-tokens-late-cancellation.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Semantic Tokens Late Cancellation: cleanup complete')
    }),
  )
}
