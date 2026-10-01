const vscode = require('vscode')

const setup = async () => {
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Native menu lifecycle' }))
}
const run = () => {}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('native-context-menu-escape-dismissal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('native-context-menu-escape-dismissal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Native Context Menu Escape Dismissal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('native-context-menu-escape-dismissal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Native Context Menu Escape Dismissal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('native-context-menu-escape-dismissal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Native Context Menu Escape Dismissal: cleanup complete')
    }),
  )
}
