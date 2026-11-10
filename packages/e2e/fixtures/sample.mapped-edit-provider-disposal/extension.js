const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryMappedEditsProvider {
  provideMappedEdits() {
    return { edits: [] }
  }
}
const run = () => {
  const registration = vscode.chat.registerMappedEditsProvider2(new TemporaryMappedEditsProvider())
  registration.dispose()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('mapped-edit-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('mapped-edit-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Mapped Edit Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('mapped-edit-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Mapped Edit Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('mapped-edit-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Mapped Edit Provider Disposal: cleanup complete')
    }),
  )
}
