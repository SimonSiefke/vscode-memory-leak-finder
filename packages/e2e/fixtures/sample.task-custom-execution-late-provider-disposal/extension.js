const vscode = require('vscode')

const prefix = 'Task Custom Execution Late Provider Disposal'
let iteration = 0
let previousSetting
let configured = false
const setup = async () => {
  previousSetting = vscode.workspace.getConfiguration('task').inspect('autoDetect')?.workspaceValue
  await vscode.workspace.getConfiguration('task').update('autoDetect', 'on', vscode.ConfigurationTarget.Workspace)
  configured = true
}
const cleanup = async () => {
  if (configured) {
    await vscode.workspace.getConfiguration('task').update('autoDetect', previousSetting, vscode.ConfigurationTarget.Workspace)
    configured = false
  }
}
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}
const bounded = async (promise, label) => {
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out: ${label}`)), 10000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}
class LateDisposedProviderState {
  value = 'disposed provider callback'
}
const discardedTask = (id) => {
  const state = new LateDisposedProviderState()
  return new vscode.Task(
    { type: 'late-disposal-task', task: `discarded-${id}` },
    vscode.TaskScope.Workspace,
    `Discarded ${id}`,
    'Disposal',
    new vscode.CustomExecution(async function lateDisposedProviderCallback() {
      throw new Error(`Must not execute: ${state.value}`)
    }),
  )
}
const run = async () => {
  const id = ++iteration
  const entered = deferred()
  const release = deferred()
  const ended = deferred()
  const close = new vscode.EventEmitter()
  const write = new vscode.EventEmitter()
  let calls = 0
  let opens = 0
  let execution
  const endListener = vscode.tasks.onDidEndTask((event) => {
    if (event.execution.task.name === `Live ${id}`) ended.resolve()
  })
  const liveTask = new vscode.Task(
    { type: 'late-disposal-task', task: `live-${id}` },
    vscode.TaskScope.Workspace,
    `Live ${id}`,
    'Disposal',
    new vscode.CustomExecution(async () => {
      calls++
      return {
        onDidWrite: write.event,
        onDidClose: close.event,
        open: () => {
          opens++
          close.fire(0)
        },
        close: () => {},
      }
    }),
  )
  liveTask.presentationOptions = { reveal: vscode.TaskRevealKind.Never, close: true }
  const live = vscode.tasks.registerTaskProvider('late-disposal-task', {
    provideTasks: () => [liveTask],
    resolveTask: () => undefined,
  })
  const disposed = vscode.tasks.registerTaskProvider('late-disposal-task', {
    provideTasks: async () => {
      entered.resolve()
      await release.promise
      return [discardedTask(id)]
    },
    resolveTask: () => undefined,
  })
  let fetch
  try {
    fetch = vscode.tasks.fetchTasks({ type: 'late-disposal-task' })
    await bounded(entered.promise, 'provider entered discovery')
    disposed.dispose()
    release.resolve()
    const tasks = await bounded(fetch, 'late discovery completed')
    if (tasks.some((task) => task.name === `Discarded ${id}`)) throw new Error('Disposed provider published a late task')
    const survivor = tasks.find((task) => task.name === `Live ${id}`)
    if (!(survivor?.execution instanceof vscode.CustomExecution)) throw new Error('Live provider callback was removed')
    execution = await bounded(vscode.tasks.executeTask(survivor), 'live task accepted')
    await bounded(ended.promise, 'live task ended')
    if (calls !== 1 || opens !== 1) throw new Error(`Live callback/open counts: ${calls}/${opens}`)
  } finally {
    disposed.dispose()
    release.resolve()
    // Drain the pending API operation before dropping the fixture's references.
    try {
      if (fetch) await bounded(fetch, 'discovery cleanup')
    } finally {
      execution?.terminate()
      live.dispose()
      endListener.dispose()
      close.dispose()
      write.dispose()
    }
  }
}
exports.activate = (context) => {
  for (const [name, action] of [
    ['setup', setup],
    ['run', run],
    ['cleanup', cleanup],
  ]) {
    context.subscriptions.push(
      vscode.commands.registerCommand(`task-custom-execution-late-provider-disposal.${name}`, async () => {
        try {
          await action()
          void vscode.window.showInformationMessage(`${prefix}: ${name} complete`)
        } catch (error) {
          void vscode.window.showErrorMessage(`${prefix}: ${name} failed: ${error.message}`)
          throw error
        }
      }),
    )
  }
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
}
