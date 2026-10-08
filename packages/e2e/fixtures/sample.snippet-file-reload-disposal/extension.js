const vscode = require('vscode')

let uri
let version = 0
const setup = async () => {
  const directory = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, '.vscode')
  await vscode.workspace.fs.createDirectory(directory)
  uri = vscode.Uri.joinPath(directory, 'lifecycle.code-snippets')
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: '' }))
}
const run = async () => {
  const current = ++version
  await vscode.workspace.fs.writeFile(
    uri,
    Buffer.from(
      JSON.stringify({
        [`Lifecycle ${current}`]: { scope: 'plaintext', prefix: `lifecycle${current}`, body: [`lifecycle body ${current}`] },
      }),
    ),
  )
}
const cleanup = async () => {
  if (uri) await vscode.workspace.fs.delete(uri)
  uri = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('snippet-file-reload-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('snippet-file-reload-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Snippet File Reload Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('snippet-file-reload-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Snippet File Reload Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('snippet-file-reload-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Snippet File Reload Disposal: cleanup complete')
    }),
  )
}
