const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryDebugFactory {
  createDebugAdapterDescriptor() {
    throw new Error('Registration test must not start a debug session')
  }
}
const run = async () => {
  const registration = vscode.debug.registerDebugAdapterDescriptorFactory('disposal-test', new TemporaryDebugFactory())
  registration.dispose()
  await vscode.commands.executeCommand('setContext', 'debug-adapter-factory-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('debug-adapter-factory-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-adapter-factory-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Adapter Factory Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-adapter-factory-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Debug Adapter Factory Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-adapter-factory-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Debug Adapter Factory Disposal: cleanup complete')
    }),
  )
}
