const vscode = require('vscode')

class SessionDebugTreeItem {
  constructor(label, collapsibleState) {
    this.label = label
    this.collapsibleState = collapsibleState
  }
}

class InlineDebugAdapter {
  constructor(program) {
    this.program = program
    this.events = new vscode.EventEmitter()
    this.onDidSendMessage = this.events.event
    this.sequence = 1
  }
  event(event, body) {
    this.events.fire({ seq: this.sequence++, type: 'event', event, body })
  }
  handleMessage(request) {
    let body = {}
    switch (request.command) {
      case 'initialize':
        body = { supportsConfigurationDoneRequest: true }
        break
      case 'threads':
        body = { threads: [{ id: 1, name: 'Main' }] }
        break
      case 'stackTrace':
        body = {
          stackFrames: [{ id: 1, name: 'sample', source: { name: 'program.js', path: this.program }, line: 2, column: 1 }],
          totalFrames: 1,
        }
        break
      case 'scopes':
        body = { scopes: [{ name: 'Local', variablesReference: 1, expensive: false }] }
        break
      case 'variables':
        body = { variables: [{ name: 'sampleValue', value: '42', type: 'number', variablesReference: 0 }] }
        break
    }
    this.events.fire({ seq: this.sequence++, type: 'response', request_seq: request.seq, success: true, command: request.command, body })
    if (request.command === 'initialize') this.event('initialized')
    if (request.command === 'configurationDone') this.event('stopped', { reason: 'breakpoint', threadId: 1, allThreadsStopped: true })
    if (request.command === 'disconnect') this.event('terminated')
  }
  dispose() {
    this.events.dispose()
  }
}

let resources = []
let requests = 0
let uri
const setup = async () => {
  uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'program.js')
  await vscode.workspace.fs.writeFile(uri, Buffer.from('const sample = 42;\nconsole.log(sample);'))
  resources.push(
    vscode.debug.registerDebugAdapterDescriptorFactory('lifecycle-tree', {
      createDebugAdapterDescriptor: () => new vscode.DebugAdapterInlineImplementation(new InlineDebugAdapter(uri.fsPath)),
    }),
  )
  resources.push(
    vscode.debug.registerDebugVisualizationProvider('tree-session', {
      provideDebugVisualization: () => [{ name: 'Show Lifecycle Tree', visualization: { treeId: 'session-tree' } }],
    }),
  )
  resources.push(
    vscode.debug.registerDebugVisualizationTreeProvider('session-tree', {
      getTreeItem() {
        requests++
        void vscode.window.showInformationMessage('Lifecycle tree requested')
        return new SessionDebugTreeItem('Lifecycle tree', vscode.TreeItemCollapsibleState.Expanded)
      },
      getChildren: (item) =>
        item.label === 'Lifecycle tree' ? [new SessionDebugTreeItem('Lifecycle child', vscode.TreeItemCollapsibleState.None)] : [],
    }),
  )
  resources.push(
    vscode.commands.registerCommand('debug-visualization-session-disposal.stop', async () => {
      if (!requests) throw new Error('Visualization tree was not requested in this session')
      let listener
      let timeout
      const stopped = new Promise((resolve, reject) => {
        listener = vscode.debug.onDidTerminateDebugSession(resolve)
        timeout = setTimeout(() => reject(new Error('Debug session did not terminate')), 7000)
      })
      try {
        await vscode.debug.stopDebugging()
        await stopped
      } finally {
        clearTimeout(timeout)
        listener.dispose()
      }
      if (vscode.debug.activeDebugSession) throw new Error('Debug session remains active')
      await vscode.commands.executeCommand('workbench.action.closeAllEditors')
      void vscode.window.showInformationMessage('Lifecycle debug session stopped')
    }),
  )
}
const run = async () => {
  requests = 0
  if (
    !(await vscode.debug.startDebugging(undefined, {
      type: 'lifecycle-tree',
      request: 'launch',
      name: 'Lifecycle tree',
      internalConsoleOptions: 'neverOpen',
    }))
  )
    throw new Error('Debug session did not start')
  await vscode.commands.executeCommand('workbench.view.debug')
}
const cleanup = async () => {
  await vscode.debug.stopDebugging()
  for (const resource of resources.splice(0)) resource.dispose()
  if (uri) await vscode.workspace.fs.delete(uri)
  uri = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('debug-visualization-session-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-session-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Visualization Session Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-session-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Debug Visualization Session Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-visualization-session-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Debug Visualization Session Disposal: cleanup complete')
    }),
  )
}
