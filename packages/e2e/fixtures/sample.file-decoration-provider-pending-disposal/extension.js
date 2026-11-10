const vscode = require('vscode')

let uri
const setup = async () => {
  uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'decoration-disposal.txt')
  await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode('Decoration request target'))
  await vscode.commands.executeCommand('workbench.view.explorer')
}
const run = async () => {
  let enter
  let timeout
  const entered = new Promise((resolve, reject) => {
    enter = resolve
    timeout = setTimeout(() => reject(new Error('Decoration provider was not invoked for the fixture file')), 6000)
  })
  const registration = vscode.window.registerFileDecorationProvider({
    provideFileDecoration(resource, token) {
      if (resource.toString() !== uri.toString()) return undefined
      enter()
      // The pending RPC, not a fixture collection, owns this promise. A fixed
      // provider queue cancels it on disposal; an unfixed queue keeps it alive.
      return new Promise((resolve) => {
        const listener = token.onCancellationRequested(() => {
          listener.dispose()
          resolve(undefined)
        })
      })
    },
  })
  try {
    await vscode.commands.executeCommand('workbench.files.action.refreshFilesExplorer')
    await entered
  } finally {
    clearTimeout(timeout)
    registration.dispose()
  }
  await vscode.commands.executeCommand('setContext', 'file-decoration-provider-pending-disposal.finished', true)
}
const cleanup = async () => {
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
  context.subscriptions.push(vscode.commands.registerCommand('file-decoration-provider-pending-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('file-decoration-provider-pending-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('File Decoration Provider Pending Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('file-decoration-provider-pending-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('File Decoration Provider Pending Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('file-decoration-provider-pending-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('File Decoration Provider Pending Disposal: cleanup complete')
    }),
  )
}
