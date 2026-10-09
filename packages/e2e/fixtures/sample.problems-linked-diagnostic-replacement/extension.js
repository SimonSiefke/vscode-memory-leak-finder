const vscode = require('vscode')

let collection
let uri
let clearCommand
const setup = async () => {
  uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'linked-diagnostic.txt')
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode('Diagnostic target'))
  collection = vscode.languages.createDiagnosticCollection('linked-lifecycle')
  clearCommand = vscode.commands.registerCommand('problems-linked-diagnostic-replacement.clear', () => collection.clear())
}
const run = () => {
  const diagnostic = new vscode.Diagnostic(new vscode.Range(0, 0, 0, 5), 'Linked lifecycle diagnostic')
  diagnostic.code = { value: 'LIFECYCLE', target: vscode.Uri.parse('https://example.invalid/diagnostic') }
  collection.set(uri, [diagnostic])
}
const cleanup = async () => {
  collection?.dispose()
  collection = undefined
  clearCommand?.dispose()
  clearCommand = undefined
  if (uri) {
    const resource = uri
    uri = undefined
    await vscode.workspace.fs.delete(resource)
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('problems-linked-diagnostic-replacement.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('problems-linked-diagnostic-replacement.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Problems Linked Diagnostic Replacement: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('problems-linked-diagnostic-replacement.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Problems Linked Diagnostic Replacement: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('problems-linked-diagnostic-replacement.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Problems Linked Diagnostic Replacement: cleanup complete')
    }),
  )
}
