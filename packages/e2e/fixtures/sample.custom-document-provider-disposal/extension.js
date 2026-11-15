const vscode = require('vscode')

let iteration = 0
class TemporaryCustomDocument {
  constructor(uri) {
    this.uri = uri
  }
  dispose() {}
}
const setup = () => {}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
}
const run = async () => {
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `temporary-${++iteration}.lifecycle`)
  await vscode.workspace.fs.writeFile(uri, new Uint8Array([1]))
  let resolved = false
  const registration = vscode.window.registerCustomEditorProvider('custom-document-provider-disposal.editor', {
    openCustomDocument: (resource) => new TemporaryCustomDocument(resource),
    resolveCustomEditor: (_document, panel) => {
      panel.webview.html = '<!doctype html><html><body>Temporary custom document</body></html>'
      resolved = true
    },
  })
  try {
    await vscode.commands.executeCommand('vscode.openWith', uri, 'custom-document-provider-disposal.editor')
    if (!resolved) throw new Error('Custom editor was not resolved')
    // Unregister while the document is open: normal close-before-unregister misses the bug.
    registration.dispose()
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  } finally {
    registration.dispose()
    await vscode.commands.executeCommand('workbench.action.closeAllEditors')
    await vscode.workspace.fs.delete(uri)
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('custom-document-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('custom-document-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Custom Document Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('custom-document-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Custom Document Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('custom-document-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Custom Document Provider Disposal: cleanup complete')
    }),
  )
}
