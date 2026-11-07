const vscode = require('vscode')

let iteration = 0
let previousSetting
const setup = async () => {
  previousSetting = vscode.workspace.getConfiguration('task').inspect('autoDetect')?.workspaceValue
  await vscode.workspace.getConfiguration('task').update('autoDetect', 'on', vscode.ConfigurationTarget.Workspace)
}
const cleanup = async () => {
  await vscode.workspace.getConfiguration('task').update('autoDetect', previousSetting, vscode.ConfigurationTarget.Workspace)
}

class CustomExecutionState {
  value = 'temporary custom execution'
}
const createTask = () => {
  const state = new CustomExecutionState()
  return new vscode.Task(
    { type: 'disposal-task', task: `temporary-${++iteration}` },
    vscode.TaskScope.Workspace,
    'Temporary',
    'Disposal',
    new vscode.CustomExecution(async function disposedProviderCallback() {
      throw new Error(`Must not execute: ${state.value}`)
    }),
  )
}
const run = async () => {
  const registration = vscode.tasks.registerTaskProvider('disposal-task', {
    provideTasks: () => [createTask()],
    resolveTask: () => undefined,
  })
  try {
    const tasks = await vscode.tasks.fetchTasks({ type: 'disposal-task' })
    if (tasks.length !== 1 || !(tasks[0].execution instanceof vscode.CustomExecution)) throw new Error('Expected one custom execution')
  } finally {
    registration.dispose()
  }
  const remaining = await vscode.tasks.fetchTasks({ type: 'disposal-task' })
  if (remaining.length !== 0) throw new Error('Disposed provider still contributes tasks')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('task-custom-execution-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('task-custom-execution-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Task Custom Execution Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('task-custom-execution-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Task Custom Execution Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('task-custom-execution-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Task Custom Execution Provider Disposal: cleanup complete')
    }),
  )
}
