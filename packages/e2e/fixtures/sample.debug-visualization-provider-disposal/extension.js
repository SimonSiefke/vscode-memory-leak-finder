const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

let iteration = 0
class TemporaryVisualizationProvider {
  provideDebugVisualization() {
    return []
  }
}
const run = () => {
  const registration = vscode.debug.registerDebugVisualizationProvider(
    `lifecycle-visualizer-${++iteration}`,
    new TemporaryVisualizationProvider(),
  )
  registration.dispose()
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('debug-visualization-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Visualization Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Debug Visualization Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Debug Visualization Provider Disposal: cleanup complete')
    }),
  )
}
