const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

const run = async () => {
  const item = vscode.window.createStatusBarItem('disposal-status', vscode.StatusBarAlignment.Left)
  item.text = 'Temporary status item'
  try {
    item.show()
    await vscode.commands.executeCommand('setContext', 'visible-status-bar-item-disposal.visible', true)
  } finally {
    item.dispose()
    await vscode.commands.executeCommand('setContext', 'visible-status-bar-item-disposal.visible', false)
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('visible-status-bar-item-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('visible-status-bar-item-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Visible Status Bar Item Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('visible-status-bar-item-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Visible Status Bar Item Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('visible-status-bar-item-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Visible Status Bar Item Disposal: cleanup complete')
    }),
  )
}
