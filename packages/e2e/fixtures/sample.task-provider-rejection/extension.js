const vscode = require('vscode')

let registration
let calls = 0
let previousAutoDetect
const setup = async () => {
  previousAutoDetect = vscode.workspace.getConfiguration('task').inspect('autoDetect')?.workspaceValue
  await vscode.workspace.getConfiguration('task').update('autoDetect', 'on', vscode.ConfigurationTarget.Workspace)
  registration = vscode.tasks.registerTaskProvider('rejected-provider', {
    provideTasks() {
      calls++
      throw new Error('Expected lifecycle fixture provider failure')
    },
    resolveTask() {
      return undefined
    },
  })
  // Settle the automatic discovery caused by installing the provider.
  await vscode.tasks.fetchTasks({ type: 'rejected-provider' })
}
const run = async () => {
  const before = calls
  await vscode.tasks.fetchTasks({ type: 'rejected-provider' })
  if (calls !== before + 1) throw new Error(`Expected one provider call, received ${calls - before}`)
}
const cleanup = async () => {
  registration?.dispose()
  registration = undefined
  await vscode.workspace.getConfiguration('task').update('autoDetect', previousAutoDetect, vscode.ConfigurationTarget.Workspace)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('task-provider-rejection.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('task-provider-rejection.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Task Provider Rejection: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('task-provider-rejection.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Task Provider Rejection: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('task-provider-rejection.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Task Provider Rejection: cleanup complete')
    }),
  )
}
