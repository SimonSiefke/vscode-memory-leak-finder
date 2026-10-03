const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

class ParticipantState {
  value = 'temporary participant payload'
}
const createParticipant = () => {
  const state = new ParticipantState()
  return vscode.chat.createChatParticipant('chat-participant-disposal.participant', async (_request, _context, stream) => {
    stream.markdown(state.value)
  })
}
const run = async () => {
  const participant = createParticipant()
  participant.dispose()
  await vscode.commands.executeCommand('setContext', 'chat-participant-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('chat-participant-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-participant-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Chat Participant Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-participant-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Chat Participant Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('chat-participant-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Chat Participant Disposal: cleanup complete')
    }),
  )
}
