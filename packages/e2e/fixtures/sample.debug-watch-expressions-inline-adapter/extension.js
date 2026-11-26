const vscode = require('vscode')

const debugType = 'watch-inline'
const watchExpression = 'counter'
// The second stop is reported after the continue response has been handled,
// like a running program reaching its next breakpoint.
const secondStopDelay = 100
// Each stop has its own frame id, so a watch evaluation can be attributed to a stop.
const getFrameId = (stop) => 1000 + stop
// Stop n pauses at the increment on line n + 1 of program.js (`counter++`).
const getLine = (stop) => stop + 1
const column = 8

class WatchInlineAdapter {
  constructor(record) {
    this.record = record
    this.events = new vscode.EventEmitter()
    this.onDidSendMessage = this.events.event
    this.sequence = 1
    this.program = ''
    this.timer = undefined
  }
  send(message) {
    if (this.record.disposed) return
    this.events.fire({ seq: this.sequence++, ...message })
  }
  event(event, body) {
    this.send({ type: 'event', event, body })
  }
  stop() {
    this.record.stops++
    this.event('stopped', { reason: 'breakpoint', threadId: 1, allThreadsStopped: true })
  }
  getBody(request) {
    const args = request.arguments || {}
    switch (request.command) {
      case 'initialize':
        return { supportsConfigurationDoneRequest: true }
      case 'launch':
        this.program = args.program
        return {}
      case 'setBreakpoints':
        return { breakpoints: [] }
      case 'threads':
        return { threads: [{ id: 1, name: 'Main' }] }
      case 'stackTrace':
        return {
          stackFrames: [
            {
              id: getFrameId(this.record.stops),
              name: '<anonymous>',
              source: { name: 'program.js', path: this.program },
              line: getLine(this.record.stops),
              column,
            },
          ],
          totalFrames: 1,
        }
      case 'scopes':
        return { scopes: [{ name: 'Local', variablesReference: 1, expensive: false }] }
      case 'variables':
        return { variables: [{ name: watchExpression, value: `${this.record.stops}`, type: 'number', variablesReference: 0 }] }
      case 'evaluate':
        this.record.evaluates.push({
          afterDisconnect: this.record.disconnected,
          context: args.context,
          expression: args.expression,
          frameId: args.frameId,
        })
        return { result: `stop-${this.record.stops}`, variablesReference: 0 }
      case 'continue':
        return { allThreadsContinued: true }
      default:
        return {}
    }
  }
  handleMessage(request) {
    if (request.type !== 'request') return
    if (request.command === 'disconnect') {
      this.record.disconnected = true
      clearTimeout(this.timer)
    }
    const body = this.getBody(request)
    this.send({ type: 'response', request_seq: request.seq, success: true, command: request.command, body })
    switch (request.command) {
      case 'initialize':
        this.event('initialized')
        break
      case 'configurationDone':
        this.stop()
        break
      case 'continue':
        this.event('continued', { threadId: 1, allThreadsContinued: true })
        this.timer = setTimeout(() => this.stop(), secondStopDelay)
        break
      case 'disconnect':
        this.event('terminated')
        break
    }
  }
  dispose() {
    clearTimeout(this.timer)
    this.record.disposed = true
    this.events.dispose()
  }
}

const createRecord = () => ({ disconnected: false, disposed: false, evaluates: [], stops: 0 })

let resources = []
let sessions = []

const removeAllWatchExpressions = async () => {
  // The workbench action is hidden from the Command Palette, but its id is stable.
  await vscode.commands.executeCommand('workbench.debug.viewlet.action.removeAllWatchExpressions')
}

const setup = async () => {
  await cleanup()
  // Watch expressions persist in workspace storage, so remove leftovers from an aborted run.
  await removeAllWatchExpressions()
  resources.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(debugType, {
      createDebugAdapterDescriptor: () => {
        const record = createRecord()
        sessions.push(record)
        return new vscode.DebugAdapterInlineImplementation(new WatchInlineAdapter(record))
      },
    }),
  )
}

const waitFor = async (predicate, message) => {
  const deadline = Date.now() + 7000
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(message)
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

const verify = async () => {
  try {
    if (sessions.length !== 1) throw new Error(`Expected one adapter since the last verification, got ${sessions.length}`)
    const [record] = sessions
    await waitFor(() => record.disposed, 'Inline debug adapter was not disposed after the session stopped')
    if (vscode.debug.activeDebugSession) throw new Error('Debug session remains active')
    if (!record.disconnected) throw new Error('Debug adapter did not receive disconnect')
    if (record.stops !== 2) throw new Error(`Expected two stops, got ${record.stops}`)
    for (let stop = 1; stop <= record.stops; stop++) {
      const frameId = getFrameId(stop)
      const matching = record.evaluates.filter(
        (evaluate) => evaluate.context === 'watch' && evaluate.expression === watchExpression && evaluate.frameId === frameId,
      )
      if (matching.length === 0) throw new Error(`No watch evaluation for stop ${stop}: ${JSON.stringify(record.evaluates)}`)
    }
    const late = record.evaluates.filter((evaluate) => evaluate.afterDisconnect)
    if (late.length > 0) throw new Error(`Evaluations after disconnect: ${JSON.stringify(late)}`)
    const watchEvaluates = record.evaluates.filter((evaluate) => evaluate.context === 'watch').length
    void vscode.window.showInformationMessage(
      `Debug Watch Expressions Inline Adapter: verify complete (${record.stops} stops, ${watchEvaluates} watch evaluations)`,
    )
  } finally {
    sessions = []
  }
}

const cleanup = async () => {
  if (vscode.debug.activeDebugSession) await vscode.debug.stopDebugging()
  for (const resource of resources.splice(0)) resource.dispose()
  sessions = []
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-watch-expressions-inline-adapter.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Debug Watch Expressions Inline Adapter: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-watch-expressions-inline-adapter.verify', async () => {
      try {
        await verify()
      } catch (error) {
        void vscode.window.showErrorMessage(`Debug Watch Expressions Inline Adapter: verify failed: ${error.message}`)
      }
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('debug-watch-expressions-inline-adapter.cleanup', async () => {
      await cleanup()
      await removeAllWatchExpressions()
      void vscode.window.showInformationMessage('Debug Watch Expressions Inline Adapter: cleanup complete')
    }),
  )
}
