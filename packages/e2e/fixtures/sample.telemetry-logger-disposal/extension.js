const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class TemporaryTelemetrySender {
  sendEventData() {}
  sendErrorData() {}
  flush() {}
}
const run = () => {
  const logger = vscode.env.createTelemetryLogger(new TemporaryTelemetrySender())
  logger.dispose()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('telemetry-logger-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('telemetry-logger-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Telemetry Logger Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('telemetry-logger-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Telemetry Logger Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('telemetry-logger-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Telemetry Logger Disposal: cleanup complete')
    }),
  )
}
