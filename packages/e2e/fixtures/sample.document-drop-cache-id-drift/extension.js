const vscode = require('vscode')

let provider
let requests = 0
let document
let verify
const setup = () => {
  provider = vscode.languages.registerDocumentDropEditProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideDocumentDropEdits() {
        requests++
        if (requests % 3 !== 0) return undefined
        return new vscode.DocumentDropEdit('accepted lifecycle drop')
      },
    },
  )
  verify = vscode.commands.registerCommand('document-drop-cache-id-drift.verify', async () => {
    if (requests % 3 !== 0 || !document.getText().includes('accepted lifecycle drop'))
      throw new Error('ID-drift drop did not apply the accepted edit')
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
    document = undefined
    void vscode.window.showInformationMessage('Accepted lifecycle drop verified')
  })
}
const run = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'drop target' })
  await vscode.window.showTextDocument(document)
}
const cleanup = async () => {
  provider?.dispose()
  provider = undefined
  verify?.dispose()
  verify = undefined
  document = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('document-drop-cache-id-drift.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('document-drop-cache-id-drift.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Document Drop Cache Id Drift: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('document-drop-cache-id-drift.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Document Drop Cache Id Drift: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('document-drop-cache-id-drift.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Document Drop Cache Id Drift: cleanup complete')
    }),
  )
}
