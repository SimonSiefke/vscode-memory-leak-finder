const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryConfigurationProvider {
  resolveDebugConfiguration(_folder, config) {
    return config
  }
}
const run = async () => {
  const live = vscode.debug.registerDebugConfigurationProvider('disposal-test', { resolveDebugConfiguration: (_folder, config) => config })
  try {
    const retired = vscode.debug.registerDebugConfigurationProvider('disposal-test', new TemporaryConfigurationProvider())
    retired.dispose()
    await vscode.commands.executeCommand('setContext', 'debug-configuration-provider-disposal.finished', true)
  } finally {
    live.dispose()
  }
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('debug-configuration-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-configuration-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Configuration Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-configuration-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Debug Configuration Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-configuration-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Debug Configuration Provider Disposal: cleanup complete')
    }),
  )
}
