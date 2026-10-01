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
    new vscode.CustomExecution(async () => {
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
    if (!tasks.some((task) => task.execution instanceof vscode.CustomExecution)) throw new Error('Custom execution was not fetched')
  } finally {
    registration.dispose()
  }
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
