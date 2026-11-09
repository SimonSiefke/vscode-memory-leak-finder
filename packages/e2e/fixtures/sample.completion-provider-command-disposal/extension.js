const vscode = require('vscode')

let document
class TemporaryCommandArgument {
  value = 'temporary command payload'
}
const setup = async () => {
  document = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'abc' })
}
const run = async () => {
  const registration = vscode.languages.registerCompletionItemProvider(
    { language: 'plaintext', scheme: 'untitled' },
    {
      provideCompletionItems() {
        const command = {
          command: 'completion-provider-command-disposal.noop',
          title: 'Lifecycle command',
          arguments: [new TemporaryCommandArgument()],
        }
        const item = new vscode.CompletionItem('lifecycle')
        item.command = command
        return [item]
      },
    },
  )
  try {
    const result = await vscode.commands.executeCommand(
      'vscode.executeCompletionItemProvider',
      document.uri,
      new vscode.Position(0, 1),
      undefined,
      1,
    )
    if (!(result && result.items.length > 0)) throw new Error('Provider result was not returned')
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
  context.subscriptions.push(vscode.commands.registerCommand('completion-provider-command-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('completion-provider-command-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Completion Provider Command Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('completion-provider-command-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Completion Provider Command Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('completion-provider-command-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Completion Provider Command Disposal: cleanup complete')
    }),
  )
}
