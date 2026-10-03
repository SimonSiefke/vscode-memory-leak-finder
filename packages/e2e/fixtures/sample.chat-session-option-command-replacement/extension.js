const vscode = require('vscode')

let controller
let input
let iteration = 0
class SessionOptionArgument {
  constructor(value) {
    this.value = value
  }
}
const setup = () => {
  controller = vscode.chat.createChatSessionItemController('lifecycle-options', async () => {})
  input = controller.createChatSessionInputState([])
}
const run = async () => {
  const value = ++iteration
  input.groups = [
    {
      id: 'lifecycle',
      name: `Lifecycle ${value}`,
      items: [],
      commands: [
        {
          command: 'chat-session-option-command-replacement.noop',
          title: 'Lifecycle option',
          arguments: [new SessionOptionArgument(value)],
        },
      ],
    },
  ]
  if (input.groups[0].name !== `Lifecycle ${value}`) throw new Error('Option group was not updated')
  await vscode.commands.executeCommand('setContext', 'chat-session-option-command-replacement.updated', value)
  input.groups = []
  if (input.groups.length) throw new Error('Option group was not cleared')
  await vscode.commands.executeCommand('setContext', 'chat-session-option-command-replacement.cleared', value)
}
const cleanup = () => {
  controller?.dispose()
  input = undefined
  controller = undefined
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('chat-session-option-command-replacement.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-session-option-command-replacement.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Chat Session Option Command Replacement: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-session-option-command-replacement.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Chat Session Option Command Replacement: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-session-option-command-replacement.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Chat Session Option Command Replacement: cleanup complete')
    }),
  )
}
