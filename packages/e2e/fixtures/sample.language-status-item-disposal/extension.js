const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

const run = async () => {
  const item = vscode.languages.createLanguageStatusItem('disposal-language-status', { language: 'plaintext' })
  item.text = 'Temporary language status'
  item.detail = 'Provider registration lifetime'
  await vscode.commands.executeCommand('setContext', 'language-status-item-disposal.registered', true)
  item.dispose()
  await vscode.commands.executeCommand('setContext', 'language-status-item-disposal.registered', false)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('language-status-item-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('language-status-item-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Language Status Item Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('language-status-item-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Language Status Item Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('language-status-item-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Language Status Item Disposal: cleanup complete')
    }),
  )
}
