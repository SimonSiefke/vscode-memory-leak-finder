const vscode = require('vscode')

let provider
let ready
const setup = () => {
  provider = vscode.languages.registerCodeLensProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideCodeLenses: () => [new vscode.CodeLens(new vscode.Range(0, 0, 0, 3))],
      resolveCodeLens(lens) {
        lens.command = { command: 'codelens-renderer-model-disposal.noop', title: 'Lifecycle lens' }
        ready?.()
        return lens
      },
    },
  )
}
const run = async () => {
  let timeout
  const resolved = new Promise((resolve, reject) => {
    ready = resolve
    timeout = setTimeout(() => reject(new Error('CodeLens was not resolved by the editor')), 6000)
  })
  try {
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' }))
    await resolved
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  } finally {
    clearTimeout(timeout)
    ready = undefined
  }
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('codelens-renderer-model-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-renderer-model-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Codelens Renderer Model Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-renderer-model-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Codelens Renderer Model Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-renderer-model-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Codelens Renderer Model Disposal: cleanup complete')
    }),
  )
}
