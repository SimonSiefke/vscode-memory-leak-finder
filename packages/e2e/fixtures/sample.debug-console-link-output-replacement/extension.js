const vscode = require('vscode')

let factory
let adapter
let uri
class LinkDebugAdapter {
  constructor() {
    this.events = new vscode.EventEmitter()
    this.onDidSendMessage = this.events.event
    this.sequence = 1
  }
  event(event, body) {
    this.events.fire({ seq: this.sequence++, type: 'event', event, body })
  }
  handleMessage(request) {
    this.events.fire({
      seq: this.sequence++,
      type: 'response',
      request_seq: request.seq,
      success: true,
      command: request.command,
      body: request.command === 'initialize' ? { supportsConfigurationDoneRequest: true } : {},
    })
    if (request.command === 'initialize') this.event('initialized')
    if (request.command === 'disconnect') this.event('terminated')
  }
  dispose() {
    this.events.dispose()
  }
}
const setup = async () => {
  uri = vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, 'linked-source.js')
  await vscode.workspace.fs.writeFile(uri, Buffer.from('const lifecycle = true'))
  factory = vscode.debug.registerDebugAdapterDescriptorFactory('lifecycle-links', {
    createDebugAdapterDescriptor() {
      adapter = new LinkDebugAdapter()
      return new vscode.DebugAdapterInlineImplementation(adapter)
    },
  })
  if (
    !(await vscode.debug.startDebugging(undefined, {
      type: 'lifecycle-links',
      request: 'launch',
      name: 'Lifecycle links',
      internalConsoleOptions: 'openOnSessionStart',
    }))
  )
    throw new Error('Debug session did not start')
}
const run = async () => {
  adapter.event('output', { category: 'console', output: `${uri.fsPath}:1:1\n` })
  await vscode.commands.executeCommand('setContext', 'debug-console-link-output-replacement.output', true)
}
const cleanup = async () => {
  await vscode.debug.stopDebugging()
  factory?.dispose()
  factory = undefined
  adapter = undefined
  if (uri) await vscode.workspace.fs.delete(uri)
  uri = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('debug-console-link-output-replacement.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-console-link-output-replacement.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Console Link Output Replacement: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-console-link-output-replacement.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Debug Console Link Output Replacement: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-console-link-output-replacement.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Debug Console Link Output Replacement: cleanup complete')
    }),
  )
}
