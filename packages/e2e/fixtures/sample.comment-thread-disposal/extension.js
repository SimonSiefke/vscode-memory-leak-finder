const vscode = require('vscode')

let controller
let editor
class TemporaryReviewComment {
  body = 'Temporary review comment'
  mode = vscode.CommentMode.Preview
  author = { name: 'Lifecycle fixture' }
}
const setup = async () => {
  controller = vscode.comments.createCommentController('disposal-thread', 'Disposal threads')
  editor = await vscode.window.showTextDocument(
    await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'Review this line' }),
  )
}
const run = async () => {
  const thread = controller.createCommentThread(editor.document.uri, new vscode.Range(0, 0, 0, 0), [new TemporaryReviewComment()])
  try {
    thread.collapsibleState = vscode.CommentThreadCollapsibleState.Expanded
    await vscode.commands.executeCommand('setContext', 'comment-thread-disposal.visible', true)
  } finally {
    thread.dispose()
  }
  await vscode.commands.executeCommand('setContext', 'comment-thread-disposal.visible', false)
}
const cleanup = async () => {
  controller?.dispose()
  controller = undefined
  editor = undefined
  await vscode.commands.executeCommand('workbench.action.revertAndCloseActiveEditor')
}

exports.activate = (context) => {
  context.subscriptions.push({
    dispose: () => {
      void cleanup()
    },
  })
  context.subscriptions.push(vscode.commands.registerCommand('comment-thread-disposal.noop', () => {}))
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-disposal.setup', async () => {
      await setup()
      void vscode.window.showInformationMessage('Comment Thread Disposal: setup complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-disposal.run', async () => {
      await run()
      void vscode.window.showInformationMessage('Comment Thread Disposal: run complete')
    }),
  )
  context.subscriptions.push(
    vscode.commands.registerCommand('comment-thread-disposal.cleanup', async () => {
      await cleanup()
      void vscode.window.showInformationMessage('Comment Thread Disposal: cleanup complete')
    }),
  )
}
