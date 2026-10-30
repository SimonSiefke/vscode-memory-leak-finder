const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryProfileProvider {
  provideTerminalProfile() {
    throw new Error('Registration test must not launch this profile')
  }
}
const run = async () => {
  const registration = vscode.window.registerTerminalProfileProvider(
    'terminal-profile-provider-disposal.profile',
    new TemporaryProfileProvider(),
  )
  registration.dispose()
  await vscode.commands.executeCommand('setContext', 'terminal-profile-provider-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('terminal-profile-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-profile-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Terminal Profile Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-profile-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Terminal Profile Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('terminal-profile-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Terminal Profile Provider Disposal: cleanup complete')
    }),
  )
}
