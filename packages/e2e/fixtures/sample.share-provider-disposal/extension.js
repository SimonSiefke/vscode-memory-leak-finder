const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryShareProvider {
  id = 'lifecycle-share'
  label = 'Lifecycle share'
  priority = 1
  selector = [{ language: 'plaintext' }]
  provideShare() {
    return 'https://example.invalid/lifecycle'
  }
}
const run = async () => {
  const registration = vscode.window.registerShareProvider([{ language: 'plaintext' }], new TemporaryShareProvider())
  registration.dispose()
  await vscode.commands.executeCommand('setContext', 'share-provider-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('share-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('share-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Share Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('share-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Share Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('share-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Share Provider Disposal: cleanup complete')
    }),
  )
}
