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
const bounded = async (promise, label, timeout = 10000) => {
  let timer
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Timed out: ${label}`)), timeout)
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
class LateCanceledProviderState {
  value = 'canceled provider callback'
}
const runCanceledCallback = async (id) => {
  const entered = deferred()
  const release = deferred()
  const ended = deferred()
  const closed = deferred()
  const write = new vscode.EventEmitter()
  const close = new vscode.EventEmitter()
  const state = new LateCanceledProviderState()
  const name = `Canceled ${id}`
  let calls = 0
  let opens = 0
  let closes = 0
  let execution
  const listener = vscode.tasks.onDidEndTask((event) => {
    if (event.execution.task.name === name) ended.resolve()
  })
  const task = new vscode.Task(
    { type: 'late-disposal-task', task: `canceled-${id}` },
    vscode.TaskScope.Workspace,
    name,
    'Disposal',
    new vscode.CustomExecution(async function lateCanceledProviderCallback() {
      calls++
      entered.resolve()
      await release.promise
      return {
        onDidWrite: write.event,
        onDidClose: close.event,
        open: () => {
          opens++
          write.fire(state.value)
          close.fire(0)
        },
        close: () => {
          closes++
          closed.resolve()
        },
      }
    }),
  )
  task.presentationOptions = { reveal: vscode.TaskRevealKind.Never, close: true }
  const provider = vscode.tasks.registerTaskProvider('late-disposal-task', {
    provideTasks: () => [task],
    resolveTask: () => undefined,
  })
  try {
    const tasks = await bounded(vscode.tasks.fetchTasks({ type: 'late-disposal-task' }), 'cancelable task discovered')
    const discovered = tasks.find((candidate) => candidate.name === name)
    if (!(discovered?.execution instanceof vscode.CustomExecution)) throw new Error('Cancelable callback was not discovered')
    execution = await bounded(vscode.tasks.executeTask(discovered), 'cancelable task accepted')
    await bounded(entered.promise, 'cancelable callback entered')
    provider.dispose()
    execution.terminate()
    await bounded(ended.promise, 'pending callback task canceled')
    release.resolve()
    // Report a missing close before the UI completion-notification deadline.
    await bounded(closed.promise, 'late PTY closed', 5000)
    if (calls !== 1 || opens !== 0 || closes !== 1) throw new Error(`Canceled callback/open/close counts: ${calls}/${opens}/${closes}`)
  } finally {
    release.resolve()
    if (execution && vscode.tasks.taskExecutions.includes(execution)) execution.terminate()
    provider.dispose()
    listener.dispose()
    write.dispose()
    close.dispose()
  }
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
    await runCanceledCallback(id)
  } finally {
    disposed.dispose()
    release.resolve()
    // Drain the pending API operation before dropping the fixture's references.
    try {
      if (fetch) await bounded(fetch, 'discovery cleanup')
    } finally {
      if (execution && vscode.tasks.taskExecutions.includes(execution)) execution.terminate()
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
          console.error(`${prefix}: ${name} failed`, error)
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
