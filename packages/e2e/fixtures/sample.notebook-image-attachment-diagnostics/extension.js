const vscode = require('vscode')

let iteration = 0
const setup = () => {}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
}
const run = async () => {
  const uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `attachment-${++iteration}.ipynb`)
  const notebook = {
    cells: [{ cell_type: 'markdown', metadata: {}, attachments: {}, source: ['![missing](attachment:missing.png)'] }],
    metadata: {},
    nbformat: 4,
    nbformat_minor: 2,
  }
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(JSON.stringify(notebook)))
  let listener
  let timeout
  const diagnosed = new Promise((resolve, reject) => {
    listener = vscode.languages.onDidChangeDiagnostics((event) => {
      if (event.uris.some((resource) => resource.scheme === 'vscode-notebook-cell' && vscode.languages.getDiagnostics(resource).length > 0))
        resolve()
    })
    timeout = setTimeout(() => reject(new Error('Notebook attachment diagnostics did not run')), 7000)
  })
  try {
    await vscode.commands.executeCommand('vscode.openWith', uri, 'jupyter-notebook')
    await diagnosed
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor')
  } finally {
    clearTimeout(timeout)
    listener?.dispose()
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
  context.subscriptions.push(vscode.commands.registerCommand('notebook-image-attachment-diagnostics.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-image-attachment-diagnostics.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Notebook Image Attachment Diagnostics: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-image-attachment-diagnostics.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Notebook Image Attachment Diagnostics: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('notebook-image-attachment-diagnostics.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Notebook Image Attachment Diagnostics: cleanup complete')
    }),
  )
}
