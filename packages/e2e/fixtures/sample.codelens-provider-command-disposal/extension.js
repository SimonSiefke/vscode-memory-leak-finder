const vscode = require('vscode')

let document
class TemporaryCommandArgument {
  value = 'temporary command payload'
}
const setup = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' })
}
const run = async () => {
  const registration = vscode.languages.registerCodeLensProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideCodeLenses() {
        const command = {
          command: 'codelens-provider-command-disposal.noop',
          title: 'Lifecycle command',
          arguments: [new TemporaryCommandArgument()],
        }
        const lens = new vscode.CodeLens(new vscode.Range(0, 0, 0, 1))
        lens.command = command
        return [lens]
      },
    },
  )
  try {
    const result = await vscode.commands.executeCommand('vscode.executeCodeLensProvider', document.uri, 1)
    if (!(Array.isArray(result) && result.length > 0)) throw new Error('Provider result was not returned')
  } finally {
    registration.dispose()
  }
}
const cleanup = () => {
  document = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('codelens-provider-command-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-provider-command-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Codelens Provider Command Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-provider-command-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Codelens Provider Command Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('codelens-provider-command-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Codelens Provider Command Disposal: cleanup complete')
    }),
  )
}
