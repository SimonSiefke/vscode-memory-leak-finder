const vscode = require('vscode')

let previousSetting
const setup = async () => {
  previousSetting = vscode.workspace.getConfiguration('accessibility.signals').inspect('progress')?.workspaceValue
  await vscode.workspace
    .getConfiguration('accessibility.signals')
    .update('progress', { sound: 'on', announcement: 'on' }, vscode.ConfigurationTarget.Workspace)
}
const run = async () => {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: 'Temporary lifecycle progress' },
    async (progress) => {
      progress.report({ message: 'Pending operation' })
      await vscode.commands.executeCommand('setContext', 'progress-accessibility-scheduler-disposal.progress', true)
    },
  )
}
const cleanup = async () => {
  await vscode.workspace.getConfiguration('accessibility.signals').update('progress', previousSetting, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('progress-accessibility-scheduler-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('progress-accessibility-scheduler-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Progress Accessibility Scheduler Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('progress-accessibility-scheduler-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Progress Accessibility Scheduler Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('progress-accessibility-scheduler-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Progress Accessibility Scheduler Disposal: cleanup complete')
    }),
  )
}
