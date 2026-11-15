const vscode = require('vscode')

let iteration = 0
const setup = () => {}
const cleanup = () => {}
const run = async () => {
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `resolved-document-${++iteration}.txt`)
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode('Unique text document'))
  try {
    const document = await vscode.workspace.openTextDocument(uri)
    await vscode.window.showTextDocument(document)
    if (document.getText() !== 'Unique text document') throw new Error('Document was not resolved')
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  } finally {
    await vscode.workspace.fs.delete(uri)
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('text-document-unique-resource-marks.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('text-document-unique-resource-marks.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Text Document Unique Resource Marks: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('text-document-unique-resource-marks.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Text Document Unique Resource Marks: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('text-document-unique-resource-marks.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Text Document Unique Resource Marks: cleanup complete')
    }),
  )
}
