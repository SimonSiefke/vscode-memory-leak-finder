const vscode = require('vscode')

const setup = async () => {
  for (const name of ['first', 'second']) {
    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `${name}.txt`),
      Buffer.from(`Rendered auxiliary editor ${name}`),
    )
  }
}
const run = () => {}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  for (const name of ['first', 'second'])
    await vscode.workspace.fs.delete(vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, `${name}.txt`))
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('auxiliary-window-pixel-ratio-close-order.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('auxiliary-window-pixel-ratio-close-order.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Auxiliary Window Pixel Ratio Close Order: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('auxiliary-window-pixel-ratio-close-order.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Auxiliary Window Pixel Ratio Close Order: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('auxiliary-window-pixel-ratio-close-order.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Auxiliary Window Pixel Ratio Close Order: cleanup complete')
    }),
  )
}
