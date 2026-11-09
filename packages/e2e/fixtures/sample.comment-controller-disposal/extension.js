const vscode = require('vscode')

const setup = () => {}
const cleanup = () => {}

const run = async () => {
  const controller = vscode.comments.createCommentController('disposal-controller', 'Disposal controller')
  controller.dispose()
  await vscode.commands.executeCommand('setContext', 'comment-controller-disposal.finished', true)
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('comment-controller-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-controller-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Comment Controller Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-controller-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Comment Controller Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-controller-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Comment Controller Disposal: cleanup complete')
    }),
  )
}
