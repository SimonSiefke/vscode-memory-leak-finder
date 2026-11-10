const vscode = require('vscode')

let controller

const cleanup = () => {
  controller?.dispose()
  controller = undefined
}

const run = () => {
  controller ??= vscode.tests.createTestController('resource-disposal', 'Resource disposal')
  const profile = controller.createRunProfile('Temporary profile', vscode.TestRunProfileKind.Run, () => {})
  try {
    profile.onDidChangeDefault(() => {})
  } finally {
    profile.dispose()
  }
}

exports.activate = (context) => {
  context.subscriptions.push(
    { dispose: cleanup },
    vscode.commands.registerCommand('test_run_profile_disposal.run', async () => {
      await run()
      // Signal completion without waiting for notification dismissal.
      void vscode.window.showInformationMessage('Test Run Profile complete')
    }),
    vscode.commands.registerCommand('test_run_profile_disposal.cleanup', () => {
      cleanup()
      void vscode.window.showInformationMessage('Test Run Profile cleanup complete')
    }),
  )
}
