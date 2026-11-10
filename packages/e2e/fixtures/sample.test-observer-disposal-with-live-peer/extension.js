const vscode = require('vscode')

let live
let controller
const setup = () => {
  controller = vscode.tests.createTestController('observer-disposal', 'Observer disposal')
  live = vscode.tests.createTestObserver()
}
const run = () => {
  const observer = vscode.tests.createTestObserver()
  // The observer owns this event relay; separately disposing the listener masks the bug.
  observer.onDidChangeTest(() => {})
  observer.dispose()
}
const cleanup = () => {
  live?.dispose()
  live = undefined
  controller?.dispose()
  controller = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('test-observer-disposal-with-live-peer.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('test-observer-disposal-with-live-peer.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Test Observer Disposal With Live Peer: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('test-observer-disposal-with-live-peer.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Test Observer Disposal With Live Peer: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('test-observer-disposal-with-live-peer.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Test Observer Disposal With Live Peer: cleanup complete')
    }),
  )
}
