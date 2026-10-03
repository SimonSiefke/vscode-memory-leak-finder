const vscode = require('vscode')

class LifecycleNotebookSerializer {
  deserializeNotebook() {
    return new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '1 + 1', 'javascript')])
  }

  serializeNotebook() {
    return new Uint8Array()
  }
}

const cleanup = () => {
  // The notebook registration is disposed within each cycle.
}

const run = async () => {
  const registration = vscode.workspace.registerNotebookSerializer('resource-disposal-notebook', new LifecycleNotebookSerializer())
  try {
    const document = await vscode.workspace.openNotebookDocument(
      'resource-disposal-notebook',
      new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, '1 + 1', 'javascript')]),
    )
    await vscode.window.showNotebookDocument(document)
    await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  } finally {
    registration.dispose()
  }
}

exports.activate = (context) => {
  context.subscriptions.push(
    { dispose: cleanup },
    vscode.commands.registerCommand('notebook_serializer_disposal.run', async () => {
      await run()
      // Signal completion without waiting for notification dismissal.
      void vscode.window.showInformationMessage('Notebook Serializer complete')
    }),
    vscode.commands.registerCommand('notebook_serializer_disposal.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Notebook Serializer cleanup complete')
    }),
  )
}
