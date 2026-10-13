const vscode = require('vscode')

let terminal
const setup = () => {
  terminal = vscode.window.createTerminal({ name: 'Content width lifecycle' })
  terminal.show(false)
}
const run = async () => {
  terminal.show(false)
  await vscode.commands.executeCommand('workbench.action.terminal.sizeToContentWidth')
  await vscode.commands.executeCommand('workbench.action.terminal.sizeToContentWidth')
}
const cleanup = () => {
  terminal?.dispose()
  terminal = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-content-width-toggle.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-content-width-toggle.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Content Width Toggle: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-content-width-toggle.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Terminal Content Width Toggle: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-content-width-toggle.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Content Width Toggle: cleanup complete')
    }),
  )
}
