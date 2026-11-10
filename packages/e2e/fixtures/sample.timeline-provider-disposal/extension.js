const vscode = require('vscode')

let uri
let iteration = 0
class TimelineCommandArgument {
  constructor(value) {
    this.value = value
  }
}
const setup = async () => {
  uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'timeline-lifecycle.txt')
  await vscode.workspace.fs.writeFile(uri, Buffer.from('Timeline lifecycle'))
  await vscode.window.showTextDocument(uri)
}
const run = async () => {
  let requested
  let timeout
  const ready = new Promise((resolve, reject) => {
    requested = resolve
    timeout = setTimeout(() => reject(new Error('Timeline provider was not requested')), 7000)
  })
  const registration = vscode.workspace.registerTimelineProvider('file', {
    id: `lifecycle-${++iteration}`,
    label: 'Lifecycle timeline',
    provideTimeline() {
      const item = new vscode.TimelineItem('Lifecycle entry', Date.now())
      item.command = { command: 'timeline-provider-disposal.noop', title: 'Lifecycle', arguments: [new TimelineCommandArgument(iteration)] }
      requested()
      return { items: [item] }
    },
  })
  try {
    await vscode.commands.executeCommand('files.openTimeline', uri)
    await ready
    await vscode.commands.executeCommand('setContext', 'timeline-provider-disposal.delivered', iteration)
  } finally {
    clearTimeout(timeout)
    registration.dispose()
  }
}
const cleanup = async () => {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors')
  if (uri) await vscode.workspace.fs.delete(uri)
  uri = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('timeline-provider-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('timeline-provider-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Timeline Provider Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('timeline-provider-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Timeline Provider Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('timeline-provider-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Timeline Provider Disposal: cleanup complete')
    }),
  )
}
