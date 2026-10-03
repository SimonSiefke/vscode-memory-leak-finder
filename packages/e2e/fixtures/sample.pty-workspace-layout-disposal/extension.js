const vscode = require('vscode')

let anchor
let oldConfirm
const setup = async () => {
  const config = vscode.workspace.getConfiguration('window')
  oldConfirm = config.inspect('confirmSaveUntitledWorkspace')?.globalValue
  await config.update('confirmSaveUntitledWorkspace', false, vscode.ConfigurationTarget.Global)
  anchor = vscode.window.createTerminal({ name: 'Persistent PTY anchor' })
}
const run = () => {}
const cleanup = async () => {
  await vscode.workspace.getConfiguration('window').update('confirmSaveUntitledWorkspace', oldConfirm, vscode.ConfigurationTarget.Global)
  anchor?.dispose()
  anchor = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('pty-workspace-layout-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('pty-workspace-layout-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Pty Workspace Layout Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('pty-workspace-layout-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Pty Workspace Layout Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('pty-workspace-layout-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Pty Workspace Layout Disposal: cleanup complete')
    }),
  )
}
