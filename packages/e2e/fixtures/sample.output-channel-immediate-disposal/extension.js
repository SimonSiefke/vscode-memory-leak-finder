const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

const run = async () => {
  // Deliberately dispose before asynchronous channel initialization completes.
  const channel = vscode.window.createOutputChannel('Immediate disposal')
  channel.dispose()
  // Drain an API round trip only after disposal, before the snapshot boundary.
  await vscode.commands.executeCommand('setContext', 'output-channel-immediate-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('output-channel-immediate-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('output-channel-immediate-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Output Channel Immediate Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('output-channel-immediate-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Output Channel Immediate Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('output-channel-immediate-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Output Channel Immediate Disposal: cleanup complete')
    }),
  )
}
