const vscode = require('vscode')

exports.activate = (context) => {
  context.subscriptions.push(
    vscode.commands.registerCommand('mocha_test_runs.discover', async () => {
      // The harness creates its workspace after launch, so workspaceContains
      // activation alone does not start the real Mocha extension reliably.
      await vscode.commands.executeCommand('mocha-vscode.getControllersForTest')
      // Setup replaces the disposable workspace between scenarios. Rebuild the
      // existing extension's watchers as well as activating it on the first run.
      await vscode.commands.executeCommand('mocha-vscode.recreateControllersForTestCommand')
      void vscode.window.showInformationMessage('Mocha bulk discovery complete')
    }),
  )
}
