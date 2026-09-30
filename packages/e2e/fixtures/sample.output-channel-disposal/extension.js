const vscode = require('vscode')

let outputAnchor

const cleanup = () => {
  outputAnchor?.dispose()
  outputAnchor = undefined
}

const run = async () => {
  outputAnchor ??= vscode.window.createOutputChannel('Lifecycle anchor')
  const channel = vscode.window.createOutputChannel('Lifecycle temporary')
  try {
    channel.appendLine('Temporary output channel contents')
    channel.show(true)
    // A command round trip lets the renderer open the channel before disposal.
    await vscode.commands.executeCommand('workbench.action.output.toggleOutput')
  } finally {
    channel.dispose()
    outputAnchor.show(true)
    await vscode.commands.executeCommand('workbench.action.closePanel')
  }
}

exports.activate = (context) => {
  context.subscriptions.push(
    { dispose: cleanup },
    vscode.commands.registerCommand('output_channel_disposal.run', async () => {
      await run()
      // Signal completion without waiting for notification dismissal.
      void vscode.window.showInformationMessage('Output Channel complete')
    }),
    vscode.commands.registerCommand('output_channel_disposal.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Output Channel cleanup complete')
    }),
  )
}
