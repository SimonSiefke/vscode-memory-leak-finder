const vscode = require('vscode')

let iteration = 0
class LateWorkspaceContextItem {
  constructor(value) {
    this.label = `Retired context ${value}`
    this.value = `Retired provider value ${value}`
  }
}
const setup = () => {}
const run = async () => {
  for (const late of [false, true]) {
    let release
    let calls = 0
    const pending = new Promise((resolve) => {
      release = resolve
    })
    const changed = new vscode.EventEmitter()
    const registration = vscode.chat.registerChatWorkspaceContextProvider(`lifecycle-${++iteration}`, {
      onDidChangeWorkspaceChatContext: changed.event,
      provideWorkspaceChatContext() {
        calls++
        return pending
      },
    })
    try {
      if (calls !== 1) throw new Error('Initial workspace context request did not start')
      if (late) registration.dispose()
      release([new LateWorkspaceContextItem(iteration)])
      // Let the awaiting provider continuation convert and publish the result.
      await Promise.resolve()
      await vscode.commands.executeCommand('setContext', 'chat-context-provider-late-disposal.iteration', iteration)
    } finally {
      registration.dispose()
      changed.dispose()
    }
  }
}
const cleanup = () => {}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('chat-context-provider-late-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-context-provider-late-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Chat Context Provider Late Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-context-provider-late-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Chat Context Provider Late Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-context-provider-late-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Chat Context Provider Late Disposal: cleanup complete')
    }),
  )
}
