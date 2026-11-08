const vscode = require('vscode')

const setup = () => {}
const run = () => {
  for (let index = 0; index < 3; index++) void vscode.commands.executeCommand('workbench.action.restartExtensionHost')
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1000)
  status.text = `Lifecycle host ${process.pid}`
  status.show()
  context.subscriptions.push(status)

  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('extension-host-overlapping-restarts.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('extension-host-overlapping-restarts.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Extension Host Overlapping Restarts: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension-host-overlapping-restarts.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Extension Host Overlapping Restarts: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('extension-host-overlapping-restarts.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Extension Host Overlapping Restarts: cleanup complete')
    }),
  )
}
