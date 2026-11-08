const vscode = require('vscode')

let serializer
const setup = () => {
  serializer = vscode.workspace.registerNotebookSerializer('unique-lifecycle-notebook', {
    deserializeNotebook: () => new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
    serializeNotebook: () => new Uint8Array(),
  })
}
const run = async () => {
  const document = await vscode.workspace.openNotebookDocument(
    'unique-lifecycle-notebook',
    new vscode.NotebookData([new vscode.NotebookCellData(vscode.NotebookCellKind.Code, 'sample', 'plaintext')]),
  )
  await vscode.window.showNotebookDocument(document)
  const resource = document.uri.toString()
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
  await vscode.commands.executeCommand('setContext', 'notebook-unique-resource-source-menu-lifecycle.closed', resource)
  if (vscode.window.visibleNotebookEditors.some((editor) => editor.notebook.uri.toString() === resource))
    throw new Error('Notebook editor remains visible')
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  serializer?.dispose()
  serializer = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('notebook-unique-resource-source-menu-lifecycle.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-unique-resource-source-menu-lifecycle.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Notebook Unique Resource Source Menu Lifecycle: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-unique-resource-source-menu-lifecycle.run', async () => {
      try {
        await run()
      } catch (error) {
        void vscode.window.showInformationMessage(String(error))
        throw error
      }
      void vscode.window.showInformationMessage('Notebook Unique Resource Source Menu Lifecycle: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-unique-resource-source-menu-lifecycle.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Unique Resource Source Menu Lifecycle: cleanup complete')
    }),
  )
}
