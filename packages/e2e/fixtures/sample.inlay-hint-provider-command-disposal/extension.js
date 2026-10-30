const vscode = require('vscode')

let document
class TemporaryCommandArgument {
  value = 'temporary command payload'
}
const setup = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' })
}
const run = async () => {
  const registration = vscode.languages.registerInlayHintsProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideInlayHints() {
        const command = {
          command: 'inlay-hint-provider-command-disposal.noop',
          title: 'Lifecycle command',
          arguments: [new TemporaryCommandArgument()],
        }
        const label = new vscode.InlayHintLabelPart('lifecycle')
        label.command = command
        return [new vscode.InlayHint(new vscode.Position(0, 1), [label])]
      },
    },
  )
  try {
    const result = await vscode.commands.executeCommand('vscode.executeInlayHintProvider', document.uri, new vscode.Range(0, 0, 0, 3))
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
  context.subscriptions.push(vscode.commands.registerCommand('inlay-hint-provider-command-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hint-provider-command-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Inlay Hint Provider Command Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hint-provider-command-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Inlay Hint Provider Command Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('inlay-hint-provider-command-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Inlay Hint Provider Command Disposal: cleanup complete')
    }),
  )
}
